// GENERATED FILE - do not edit by hand.
// Source: design/build_level2_artbounds.py (re-run it to regenerate).
// Tight alpha bounding box of every cell of every Level 2 plate, as the
// [sx,sy,sw,sh] source rect for ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh).
// Cells read left-to-right, top-to-bottom from index 0. A null cell is a
// fully transparent spare. EXCEPTION: the tiling plates (conveyor-belt-v2,
// lava-channel-v2, furnace-background-v2) carry the FULL cell rect, not the
// alpha bounds - a tight crop would break their seamless repeat.
window.L2ART={
"pack-assist-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[25,51,137,160],[211,58,163,139],[411,53,152,165],[606,60,125,155],[14,286,168,164],[207,290,158,155],[394,308,170,125],[597,303,150,156]]},
"supervisor-head-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[21,58,150,130],[213,58,150,185],[405,58,150,130],[597,58,150,130],[21,310,150,139],[203,269,170,176],[404,308,152,131],null]},
"enemy-crawler-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[32,100,133,96],[225,100,132,95],[414,100,133,98],[612,100,128,98],[33,357,137,95],[226,317,135,135],[415,339,136,114],[588,353,152,101]]},
"enemy-spitter-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[13,69,155,153],[205,69,156,153],[396,69,155,153],[586,69,171,153],[13,288,167,152],[205,287,156,153],[396,287,150,153],[594,331,144,79]]},
"enemy-claw-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[21,30,149,179],[218,30,140,179],[408,30,144,179],[603,30,137,198],[16,287,166,193],[229,286,119,191],[423,280,142,188],[586,358,170,63]]},
"enemy-wasp-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[13,79,165,94],[204,83,170,97],[397,90,169,91],[608,80,146,102],[60,314,66,131],[215,327,139,97],[413,317,132,122],[602,313,140,120]]},
"furnace-platform-atlas-v2.png":{w:768,h:512,cols:3,rows:2,cells:[[19,99,224,80],[269,99,230,82],[525,107,225,69],[18,338,225,80],[269,332,230,85],[540,313,211,101]]},
"furnace-prop-atlas-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[15,113,167,98],[242,74,111,143],[412,75,135,137],[597,81,153,128],[40,315,117,132],[223,338,136,97],[405,285,145,160],[587,329,166,118]]},
"casting-mold-v2.png":{w:512,h:512,cols:1,rows:1,cells:[[35,212,441,116]]},
"coolant-mist-v2.png":{w:768,h:512,cols:4,rows:2,cells:[[44,113,97,76],[209,81,165,130],[394,64,172,162],[586,40,161,203],[24,298,158,171],[202,305,164,154],[404,310,144,143],[590,269,157,189]]},
"conveyor-belt-v2.png":{w:1536,h:256,cols:4,rows:1,cells:[[0,0,384,256],[384,0,384,256],[768,0,384,256],[1152,0,384,256]]},
"lava-channel-v2.png":{w:1536,h:256,cols:4,rows:1,cells:[[0,0,384,256],[384,0,384,256],[768,0,384,256],[1152,0,384,256]]},
"furnace-background-v2.png":{w:2172,h:724,cols:1,rows:1,cells:[[0,0,2172,724]]}
};
