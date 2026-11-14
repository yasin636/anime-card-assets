package com.yasin636.cloudstream

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableArray
import com.lagradost.cloudstream3.APIHolder
import com.lagradost.cloudstream3.MainAPI
import com.lagradost.cloudstream3.plugins.Plugin
import com.lagradost.cloudstream3.utils.ExtractorLink
import com.lagradost.cloudstream3.utils.ExtractorLinkType
import java.io.File
import java.util.zip.ZipFile
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Limited CloudStream-compatible provider host + React Native bridge.
 *
 * Loads explicitly-provided .cs3 plugins (no marketplace / arbitrary repo /
 * auto-update), exposes a bounded data interface (list / search / load /
 * loadLinks). Plugin code runs in-process via PathClassLoader; this is
 * interface-bounded isolation, NOT a security sandbox — no host
 * account/secret/credential is ever passed to plugin code via this bridge.
 *
 * Licence: hosts the GPLv3 CloudStream library; see preserved notices.
 */
class CloudStreamHostModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CloudStreamHost"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    /** Loaded providers by name. */
    private val providers = mutableMapOf<String, MainAPI>()

    /** Loaded plugin file name -> plugin instance (kept for unload). */
    private val loadedPlugins = mutableMapOf<String, Plugin>()

    /**
     * Load a .cs3 plugin from the app's filesDir/cloudstream/<fileName>.
     * Fails honestly with a `load-error` code; a broken plugin is isolated
     * (does not crash the host).
     */
    @ReactMethod
    fun loadProvider(fileName: String, promise: Promise) {
        scope.launch {
            try {
                if (providers.containsKey(fileName)) {
                    promise.resolve(makeResult(true, "already loaded"))
                    return@launch
                }
                val file = File(reactContext.filesDir, "cloudstream/$fileName")
                if (!file.exists()) {
                    promise.reject("load-error", "Provider file not found: $fileName")
                    return@launch
                }
                loadCs3(file, reactContext.applicationContext, fileName)
                providers[fileName] = APIHolder.getApiFromNameNull(fileName)
                    ?: throw RuntimeException("Provider did not register a MainAPI named $fileName")
                promise.resolve(makeResult(true, "loaded"))
            } catch (e: Throwable) {
                promise.reject("load-error", e.message ?: e.toString())
            }
        }
    }

    /** List loaded provider names. */
    @ReactMethod
    fun listProviders(promise: Promise) {
        val arr = Arguments.createArray()
        providers.keys.forEach { arr.pushString(it) }
        promise.resolve(arr)
    }

    /** Search a loaded provider. Returns mapped search hits. */
    @ReactMethod
    fun search(providerName: String, query: String, promise: Promise) {
        scope.launch {
            try {
                val api = providers[providerName] ?: throw RuntimeException("Unknown provider: $providerName")
                val results = api.search(query) ?: emptyList()
                promise.resolve(mapSearchResults(results))
            } catch (e: Throwable) {
                promise.reject("search-error", e.message ?: e.toString())
            }
        }
    }

    /** Load details for a provider item url. Returns mapped details + episodes. */
    @ReactMethod
    fun load(providerName: String, url: String, promise: Promise) {
        scope.launch {
            try {
                val api = providers[providerName] ?: throw RuntimeException("Unknown provider: $providerName")
                val response = api.load(url) ?: throw RuntimeException("No load response")
                promise.resolve(mapLoadResponse(response))
            } catch (e: Throwable) {
                promise.reject("load-error", e.message ?: e.toString())
            }
        }
    }

    /** Resolve stream links + subtitles for a load-data string. */
    @ReactMethod
    fun loadLinks(providerName: String, data: String, promise: Promise) {
        scope.launch {
            try {
                val api = providers[providerName] ?: throw RuntimeException("Unknown provider: $providerName")
                val links = mutableListOf<ExtractorLink>()
                val subs = mutableListOf<Pair<String, String>>()
                val ok = api.loadLinks(data, false, { sub ->
                    subs.add(sub.lang to sub.url)
                }, { link -> links.add(link) })
                val out = Arguments.createMap()
                out.putBoolean("ok", ok)
                out.putArray("links", mapLinks(links))
                out.putArray("subtitles", mapSubtitles(subs))
                promise.resolve(out)
            } catch (e: Throwable) {
                promise.reject("loadLinks-error", e.message ?: e.toString())
            }
        }
    }

    /** Unload a provider (best-effort). */
    @ReactMethod
    fun unloadProvider(fileName: String, promise: Promise) {
        scope.launch {
            try {
                loadedPlugins.remove(fileName)?.let { /* host teardown hook if any */ }
                providers.remove(fileName)
                promise.resolve(makeResult(true, "unloaded"))
            } catch (e: Throwable) {
                promise.reject("unload-error", e.message ?: e.toString())
            }
        }
    }

    // ---- plugin loading ----

    private fun loadCs3(file: File, context: Context, label: String) {
        val extractDir = File(context.cacheDir, "cs3_$label").apply { mkdirs() }
        // Extract manifest.json + classes.dex from the .cs3 (zip).
        ZipFile(file).use { zip ->
            val entries = zip.entries()
            while (entries.hasMoreElements()) {
                val entry = entries.nextElement()
                if (entry.isDirectory) continue
                val out = File(extractDir, entry.name)
                out.parentFile?.mkdirs()
                zip.getInputStream(entry).use { it.copyTo(out.outputStream()) }
            }
        }
        // Android 14+ requires dynamic code to be read-only.
        File(extractDir, "classes.dex").apply { if (exists()) setReadOnly() }
        val classLoader = dalvik.system.PathClassLoader(
            File(extractDir, "classes.dex").absolutePath,
            javaClass.classLoader,
        )
        val manifest = JSONObject(File(extractDir, "manifest.json").readText())
        val className = manifest.optString("pluginClassName")
            .takeIf { it.isNotBlank() }
            ?: throw RuntimeException("manifest.json missing pluginClassName")
        val clazz = Class.forName(className, true, classLoader)
        val plugin = clazz.getDeclaredConstructor().newInstance() as Plugin
        plugin.filename = label
        plugin.load(context)
        loadedPlugins[label] = plugin
    }

    // ---- mapping ----

    private fun makeResult(ok: Boolean, message: String): WritableMap {
        val m = Arguments.createMap()
        m.putBoolean("ok", ok)
        m.putString("message", message)
        return m
    }

    private fun mapSearchResults(results: List<com.lagradost.cloudstream3.SearchResponse>): WritableArray {
        val arr = Arguments.createArray()
        for (r in results) {
            val m = Arguments.createMap()
            m.putString("name", safe(r.name))
            m.putString("url", safe(r.url))
            m.putString("apiName", safe(r.apiName))
            m.putString("type", r.type?.name ?: "")
            r.posterUrl?.let { m.putString("posterUrl", it) }
            r.year?.let { m.putInt("year", it) }
            r.id?.let { m.putInt("id", it) }
            arr.pushMap(m)
        }
        return arr
    }

    private fun mapLoadResponse(response: com.lagradost.cloudstream3.LoadResponse): WritableMap {
        val m = Arguments.createMap()
        m.putString("name", safe(response.name))
        m.putString("url", safe(response.url))
        m.putString("apiName", safe(response.apiName))
        m.putString("type", response.type?.name ?: "")
        response.posterUrl?.let { m.putString("posterUrl", it) }
        response.year?.let { m.putInt("year", it) }
        response.plot?.let { m.putString("plot", it) }
        response.duration?.let { m.putInt("duration", it) }
        // Episodes for series/anime.
        when (response) {
            is com.lagradost.cloudstream3.TvSeriesLoadResponse -> {
                val eps = Arguments.createArray()
                response.episodes.forEach { ep ->
                    val em = Arguments.createMap()
                    em.putString("name", safe(ep.name))
                    em.putString("url", safe(ep.url))
                    em.putInt("episode", ep.episode)
                    em.putInt("season", ep.season)
                    ep.rate?.let { em.putDouble("rate", it.toDouble()) }
                    eps.pushMap(em)
                }
                m.putArray("episodes", eps)
            }
            is com.lagradost.cloudstream3.AnimeLoadResponse -> {
                val eps = Arguments.createArray()
                response.episodes.forEach { ep ->
                    val em = Arguments.createMap()
                    em.putString("name", safe(ep.name))
                    em.putString("url", safe(ep.url))
                    em.putInt("episode", ep.episode)
                    eps.pushMap(em)
                }
                m.putArray("episodes", eps)
            }
            else -> m.putArray("episodes", Arguments.createArray())
        }
        return m
    }

    private fun mapLinks(links: List<ExtractorLink>): WritableArray {
        val arr = Arguments.createArray()
        for (l in links) {
            val m = Arguments.createMap()
            m.putString("source", safe(l.source))
            m.putString("name", safe(l.name))
            m.putString("url", safe(l.url))
            m.putString("referer", safe(l.referer))
            m.putInt("quality", l.quality)
            m.putString("type", l.type.name)
            // Bounded header allowlist (no arbitrary header pass-through).
            val headers = Arguments.createMap()
            for ((k, v) in l.headers) {
                if (k.lowercase() in ALLOWED_PLAYBACK_HEADERS) headers.putString(k, v)
            }
            m.putMap("headers", headers)
            arr.pushMap(m)
        }
        return arr
    }

    private fun mapSubtitles(subs: List<Pair<String, String>>): WritableArray {
        val arr = Arguments.createArray()
        for ((lang, url) in subs) {
            val m = Arguments.createMap()
            m.putString("lang", lang)
            m.putString("url", url)
            arr.pushMap(m)
        }
        return arr
    }

    private fun safe(s: String?): String = s ?: ""

    companion object {
        /** Only these headers may be surfaced to the player boundary. */
        private val ALLOWED_PLAYBACK_HEADERS = setOf("referer", "user-agent")
    }
}
