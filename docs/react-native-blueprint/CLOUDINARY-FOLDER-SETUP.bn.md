# Cloudinary সীমিত folder access — owner-এর জন্য

## বর্তমান সমস্যা ও অনিশ্চয়তা
v0.11.0 screenshot-এ direct upload চলার পর generic permission message এসেছে। আগের APK 401/403 একই নামে দেখাত; তাই screenshot একা দিয়ে folder permission-ই নিশ্চিত কারণ বলা যায় না। v0.11.1 provider response থেকে শুধু নিরাপদ allowlisted code + request stage দেখায়; raw message, credential, signing string দেখায় বা log করে না।

- `upload / media-provider-signature`: signing/configuration mismatch; folder role বাড়ানো সমাধান নয়।
- `media-provider-key` / `media-provider-auth`: same environment-এর Key/Secret pairing বা authorization যাচাই; chat-এ secret নয়।
- `media-provider-folder`: provider message-এ folder/access-denied evidence আছে।
- `media-provider-forbidden`: generic 403; role/folder কারণ হতে পারে, নিশ্চিত নয়।
- `media-provider-expired` বা `media-upload-not-ready`: expired pending Remove করে পুনরায় ছবি বেছে নিতে হবে।

## ফোন ব্যবহারকারী হলে
প্রথমে নতুন APK + backend deploy দিয়ে error-only screenshot দিন। কম্পিউটার/Node না থাকলে command চালানোর চেষ্টা করবেন না। Cloudinary support-কে app API key-তে শুধু `animemetahub` folder-এর Editor access দেওয়ার সহায়তা চাইতে পারেন; login/password/API Secret দেবেন না। Master Admin নির্বাচন বা billing পরিবর্তন এই সমাধানের অংশ নয়।

## নিজস্ব বিশ্বস্ত কম্পিউটারে one-time tool (ঐচ্ছিক)
এই tool agent চালায়নি; mock tests ছাড়া live Cloudinary-তে যাচাই হয়নি। Owner নিজের ডিভাইসে existing admin/root credential দিয়ে একবার সীমিত folder role assign করতে পারেন। ওই admin secret Render/APK/Git/chat-এ লাগবে না। না বুঝে চালাবেন না; প্রয়োজন হলে ধাপে ধাপে সাহায্য নিন।

Node 20+ ও repository থাকলে:

```sh
node tools/cloudinary-folder-setup.cjs
```

এটি default dry run: network বা credential input নয়, শুধু কী পরিবর্তন হবে দেখায়।

অনুমোদন দিলে:

```sh
node tools/cloudinary-folder-setup.cjs --apply
```

1. exact `animemetahub` লিখে consent দিন।
2. Cloud name, app-এর `AnimeMetaHub` API Key, এবং আলাদা existing admin/root API Key নিজের terminal-এ দিন। এগুলো এক environment-এর হতে হবে।
3. Admin/root API Secret hidden prompt-এ দিন (screen-এ echo হয় না)। Shell argument, chat বা screenshot-এ secret নয়।
4. Tool শুধু root folder list/check, প্রয়োজন হলে `animemetahub` folder create, তারপর app key-তে `cld::role::folder::editor` add করে। কোনো global Master Admin grant, asset delete, billing, upload preset বা অন্য folder পরিবর্তন করে না।
5. App key-এর existing `Media Library User` global role রেখে দিন। Render-এ app key/secret-ই থাকবে; root/admin secret সেখানে বদলে বসাবেন না।
6. Provider request accepted হলেও live upload/inspect/delete পরীক্ষা ছাড়া setup verified নয়। Account যদি role ID বা endpoint গ্রহণ না করে, tool থামে; permission নিজে থেকে বাড়ায় না।

কেবল tool-এর দেওয়া Editor grant revoke করতে:

```sh
node tools/cloudinary-folder-setup.cjs --apply --revoke
```

এটি ওই app key-এর ওই folder-এর Editor grant-ই সরায়; folder/media/key মুছে না। Shared grants আগে থেকে ব্যবহৃত হলে revoke-ও অন্য integration-কে প্রভাবিত করতে পারে—আগে নিশ্চিত হন।

## সূত্র
- https://cloudinary.com/documentation/admin_api#assign_folder_roles
- https://cloudinary.com/documentation/dam_admin_permissions
- https://cloudinary.com/documentation/authentication_signatures

API-key folder assignment programmatic; Console-এ role dropdown বাছাই করাই folder access নয়। Official docs-এর বর্তমান standard role ID ব্যবহার করা হয়েছে; real account compatibility agent যাচাই করেনি।
