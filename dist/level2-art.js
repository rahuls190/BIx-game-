// GENERATED FILE - do not edit by hand.
// Source: design/build_level2_artbounds.py (re-run it to regenerate).
// Tight alpha bounding box of every cell of every Level 2 plate, as the
// [sx,sy,sw,sh] source rect for ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh).
// Cells read left-to-right, top-to-bottom from index 0. A null cell is a
// fully transparent spare. EXCEPTION: the tiling plates (conveyor-belt-v1,
// lava-channel-v1, furnace-background-v1) carry the FULL cell rect, not the
// alpha bounds - a tight crop would break their seamless repeat.
window.L2ART={
"pack-assist-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[105,148,174,207],[489,148,232,207],[869,124,182,203],[1266,116,156,255],[51,627,282,282],[457,667,238,194],[815,660,290,167],[1243,660,212,201]]},
"supervisor-head-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[73,181,238,148],[457,181,238,148],[841,181,238,148],[1225,181,238,148],[73,661,238,180],[415,745,338,91],[865,673,190,190],null]},
"enemy-crawler-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[91,207,217,153],[478,207,214,155],[859,207,217,154],[1246,207,214,156],[76,719,215,155],[475,719,217,153],[819,677,282,196],[1243,719,251,153]]},
"enemy-spitter-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[59,161,250,190],[443,161,250,190],[827,161,250,190],[1211,161,322,190],[59,673,230,190],[443,673,250,190],[827,673,170,190],[1237,731,156,74]]},
"enemy-claw-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[112,63,160,305],[506,43,140,305],[904,43,112,305],[1288,103,112,305],[62,645,260,340],[526,635,100,305],[890,515,140,305],[1153,735,382,80]]},
"enemy-wasp-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[118,218,149,69],[502,225,148,62],[887,225,147,62],[1270,225,148,62],[159,716,66,109],[502,719,148,80],[870,702,163,149],[1237,664,230,147]]},
"furnace-platform-atlas-v1.png":{w:1536,h:1024,cols:3,rows:2,cells:[[39,151,434,210],[551,151,434,210],[1063,202,434,108],[39,663,434,210],[551,663,434,210],[1063,665,434,157]]},
"furnace-prop-atlas-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[93,255,240,99],[511,209,130,213],[873,145,174,222],[1263,175,162,162],[131,668,154,158],[487,685,178,142],[841,615,238,280],[1191,669,306,206]]},
"casting-mold-v1.png":{w:1254,h:1254,cols:1,rows:1,cells:[[147,441,960,309]]},
"coolant-mist-v1.png":{w:1536,h:1024,cols:4,rows:2,cells:[[110,201,137,98],[497,174,182,156],[834,160,259,193],[1175,160,297,249],[37,639,331,217],[421,578,335,217],[857,566,214,202],[1252,552,183,165]]},
"conveyor-belt-v1.png":{w:1536,h:256,cols:4,rows:1,cells:[[0,0,384,256],[384,0,384,256],[768,0,384,256],[1152,0,384,256]]},
"lava-channel-v1.png":{w:1536,h:256,cols:4,rows:1,cells:[[0,0,384,256],[384,0,384,256],[768,0,384,256],[1152,0,384,256]]},
"furnace-background-v1.png":{w:2172,h:724,cols:1,rows:1,cells:[[0,0,2172,724]]}
};
