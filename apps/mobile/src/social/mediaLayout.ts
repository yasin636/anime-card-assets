// Full-width ordinary media. Extremely tall images get an explicit bounded preview.
export function mediaLayout(width:number,height:number,available:number){
 const w=Number.isFinite(width)&&width>0?width:1,h=Number.isFinite(height)&&height>0?height:1;
 const ratio=w/h,tall=ratio<.6;
 return {ratio,tall,height:Math.round(available/Math.max(ratio,.6))};
}
