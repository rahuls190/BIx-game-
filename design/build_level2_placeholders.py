# Generates Level 2 greybox placeholder plates to dist/assets.
# Flat colour silhouettes, transparent PNG-24, no baked shadow or glow:
# painted art can replace any plate without a code change.
import os, math, random
from PIL import Image, ImageDraw
import numpy as np

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist', 'assets')
os.makedirs(OUT, exist_ok=True)
SS = 4  # supersample

STEEL=(26,46,54,255); STEELS=(72,112,122,255); EDGE=(255,200,74,255)
MINT=(89,226,194,255); YELLOW=(255,215,90,255); MOLTEN=(255,157,35,255)
HOT=(255,224,46,255); RED=(255,77,58,255); CREAM=(237,240,220,255)
WARM=(58,36,24,255); DARK=(15,30,36,255); SHELL=(217,223,218,255); GREY=(138,90,74,255)
VISOR=(16,37,43,255); PIPE=(45,74,84,255)

class P:
    """Draw in cell coordinates; scales into the supersampled buffer."""
    def __init__(self, d, S): self.d=d; self.S=S
    def _b(self,x,y,w,h): S=self.S; return [x*S,y*S,(x+w)*S,(y+h)*S]
    def rect(self,x,y,w,h,fill=None,outline=None,width=2,r=0):
        b=self._b(x,y,w,h)
        if r: self.d.rounded_rectangle(b,radius=r*self.S,fill=fill,outline=outline,width=int(width*self.S))
        else: self.d.rectangle(b,fill=fill,outline=outline,width=int(width*self.S))
    def ell(self,cx,cy,rx,ry,fill=None,outline=None,width=2):
        S=self.S
        self.d.ellipse([(cx-rx)*S,(cy-ry)*S,(cx+rx)*S,(cy+ry)*S],fill=fill,outline=outline,width=int(width*S))
    def poly(self,pts,fill=None,outline=None,width=2):
        S=self.S
        self.d.polygon([(x*S,y*S) for x,y in pts],fill=fill,outline=outline,width=int(width*S))
    def line(self,pts,fill,width=3,joint='curve'):
        S=self.S
        self.d.line([(x*S,y*S) for x,y in pts],fill=fill,width=int(width*S),joint=joint)

def cell(w,h,draw_fn):
    img=Image.new('RGBA',(w*SS,h*SS),(0,0,0,0))
    draw_fn(P(ImageDraw.Draw(img),SS),w,h)
    return img.resize((w,h),Image.LANCZOS)

def plate(name,W,H,cols,rows,fns):
    img=Image.new('RGBA',(W,H),(0,0,0,0))
    cw,ch=W//cols,H//rows
    for i,fn in enumerate(fns):
        if fn is None: continue
        img.alpha_composite(cell(cw,ch,fn),((i%cols)*cw,(i//cols)*ch))
    img.save(os.path.join(OUT,name)); return name

# ---------------- PACK ASSIST ----------------
def pack_body(p,cx,cy,eye=MINT,s=1.0,tilt=0):
    bw,bh=150*s,112*s
    p.rect(cx-bw/2,cy-bh/2,bw,bh,fill=SHELL,outline=GREY,width=4,r=34*s)
    p.rect(cx-bw*0.30,cy-bh*0.26,bw*0.60,bh*0.44,fill=VISOR,r=16*s)
    p.ell(cx,cy-bh*0.04,15*s,15*s,fill=eye)
    p.line([(cx,cy-bh/2),(cx,cy-bh/2-34*s)],GREY,6*s); p.ell(cx,cy-bh/2-40*s,9*s,9*s,fill=eye)
def pack_arm(p,x0,y0,x1,y1,w=9):
    p.line([(x0,y0),(x1,y1)],GREY,w); p.ell(x1,y1,10,10,fill=SHELL)
def pa0(p,w,h):
    cx,cy=w/2,h/2; pack_body(p,cx,cy); pack_arm(p,cx-58,cy+40,cx-74,cy+86); pack_arm(p,cx+58,cy+40,cx+74,cy+86)
def pa1(p,w,h):
    cx,cy=w/2,h/2; pack_body(p,cx,cy)
    p.line([(cx+62,cy+6),(cx+124,cy+6),(cx+124,cy+72)],GREY,11); p.rect(cx+108,cy+66,34,26,fill=SHELL,outline=GREY,width=4,r=6)
    pack_arm(p,cx-58,cy+40,cx-74,cy+86)
def pa2(p,w,h):
    cx,cy=w/2,h/2-24; pack_body(p,cx,cy,eye=MOLTEN)
    for i,r in enumerate((44,66,88)): p.ell(cx,cy+2,r,r*0.42,outline=MOLTEN,width=4)
    pack_arm(p,cx-58,cy+40,cx-78,cy+82); pack_arm(p,cx+58,cy+40,cx+78,cy+82)
def pa3(p,w,h):
    cx,cy=w/2,h/2-32; pack_body(p,cx,cy)
    p.rect(cx-30,cy+70,60,74,fill=DARK,outline=MINT,width=5,r=8); p.rect(cx-17,cy+84,34,46,fill=MINT)
    p.rect(cx-13,cy+60,26,12,fill=MINT)
    pack_arm(p,cx-56,cy+44,cx-32,cy+92); pack_arm(p,cx+56,cy+44,cx+32,cy+92)
def pa4(p,w,h):
    cx,cy=w/2,h/2;
    for r in (78,108,138): p.ell(cx,cy,r,r,outline=MINT,width=5)
    pack_body(p,cx,cy); pack_arm(p,cx-58,cy+40,cx-74,cy+86); pack_arm(p,cx+58,cy+40,cx+74,cy+86)
def pa5(p,w,h):
    cx,cy=w/2,h/2+34; pack_body(p,cx,cy)
    p.rect(cx-116,cy-132,232,30,fill=STEEL,outline=STEELS,width=4,r=4)
    p.line([(cx-46,cy-34),(cx-70,cy-98)],GREY,11); p.line([(cx+46,cy-34),(cx+70,cy-98)],GREY,11)
    p.ell(cx-70,cy-104,11,11,fill=SHELL); p.ell(cx+70,cy-104,11,11,fill=SHELL)
def pa6(p,w,h):
    cx,cy=w/2,h/2; pack_body(p,cx,cy)
    p.line([(cx-60,cy+22),(cx-126,cy+4)],GREY,11); p.ell(cx-130,cy+2,12,12,fill=SHELL)
    p.line([(cx+60,cy+22),(cx+126,cy+4)],GREY,11); p.ell(cx+130,cy+2,12,12,fill=SHELL)
def pa7(p,w,h):
    cx,cy=w/2+18,h/2
    for i,dx in enumerate((-96,-66,-38)): p.line([(cx+dx-20,cy-30+i*22),(cx+dx+12,cy-30+i*22)],GREY,5)
    pack_body(p,cx,cy); pack_arm(p,cx-56,cy+42,cx-80,cy+80); pack_arm(p,cx+56,cy+42,cx+80,cy+80)

# ---------------- SUPERVISOR ----------------
def sup(p,w,h,eyedx=0,eye=RED,gantry=False,stall=False):
    cx,cy=w/2,h/2+14
    if gantry:
        p.rect(cx-150,cy-150,300,26,fill=STEEL,outline=STEELS,width=4); p.line([(cx,cy-124),(cx,cy-86)],GREY,10)
    p.rect(cx-116,cy-86,232,120,fill=(36,24,32,255),outline=eye,width=6,r=20)
    p.rect(cx-78,cy-58,156,54,fill=(10,15,20,255),r=10)
    p.ell(cx+eyedx,cy-30,20,20,fill=eye)
    if stall:
        for dx in (-54,54): p.line([(cx+dx,cy-96),(cx+dx,cy-118)],MINT,6)
    p.rect(cx-40,cy+34,80,22,fill=STEEL,outline=STEELS,width=4)
def sv(dx=0,eye=RED,g=False,st=False): return lambda p,w,h: sup(p,w,h,dx,eye,g,st)
def sv_close(p,w,h):
    cx,cy=w/2,h/2
    p.ell(cx,cy,92,92,fill=(36,24,32,255),outline=RED,width=7); p.ell(cx,cy,44,44,fill=RED)
    p.ell(cx,cy,18,18,fill=HOT)
def sv_gantry(p,w,h):
    cx,cy=w/2,h/2
    p.rect(cx-158,cy-20,316,36,fill=STEEL,outline=STEELS,width=5)
    for x in range(-140,150,48): p.line([(cx+x,cy+16),(cx+x+24,cy+64)],STEELS,6)

# ---------------- CRAWLER ----------------
def crawler(p,w,h,legs,eye=RED,stun=False,grab=False,flip=False):
    cx,cy=w/2,h/2+18; sgn=-1 if flip else 1
    for (ax,ay) in legs:
        p.line([(cx+sgn*ax*0.42,cy+6),(cx+sgn*ax,cy+ay)],GREY,8)
    p.poly([(cx-96,cy-8),(cx-62,cy-54),(cx+62,cy-54),(cx+96,cy-8),(cx+78,cy+14),(cx-78,cy+14)],fill=(58,42,34,255),outline=eye,width=6)
    p.ell(cx+sgn*54,cy-30,15,15,fill=eye)
    p.line([(cx+sgn*78,cy-44),(cx+sgn*112,cy-62)],GREY,7)
    if grab:
        p.line([(cx+sgn*96,cy-14),(cx+sgn*146,cy-34)],GREY,9); p.line([(cx+sgn*96,cy+2),(cx+sgn*146,cy+18)],GREY,9)
    if stun:
        for a in range(0,360,45):
            r=math.radians(a); p.line([(cx+math.cos(r)*104,cy-20+math.sin(r)*64),(cx+math.cos(r)*138,cy-20+math.sin(r)*86)],MINT,6)
L_A=[(-96,74),(-34,82),(34,78),(96,70)]; L_B=[(-88,80),(-40,62),(40,84),(88,60)]
L_C=[(-96,66),(-30,84),(30,62),(96,80)]; L_D=[(-84,84),(-44,70),(44,66),(84,82)]
def cr(legs,**k): return lambda p,w,h: crawler(p,w,h,legs,**k)

# ---------------- SPITTER ----------------
def spitter(p,w,h,eye=RED,barrel=0,flash=False,shut=False):
    cx,cy=w/2,h/2
    p.rect(cx-130,cy-92,44,184,fill=STEEL,outline=STEELS,width=5)
    if shut:
        p.rect(cx-86,cy-56,120,112,fill=STEEL,outline=STEELS,width=5,r=8)
        for i in range(4): p.line([(cx-80,cy-38+i*26),(cx+28,cy-38+i*26)],STEELS,5)
        return
    p.rect(cx-86,cy-54,126,108,fill=WARM,outline=MOLTEN,width=6,r=12)
    p.rect(cx+34+barrel,cy-24,80,48,fill=STEEL,outline=STEELS,width=5,r=6)
    p.ell(cx-26,cy,22,22,fill=eye)
    if flash:
        p.poly([(cx+118+barrel,cy),(cx+186,cy-46),(cx+168,cy),(cx+186,cy+46)],fill=HOT)
def sp(**k): return lambda p,w,h: spitter(p,w,h,**k)
def sp_slug(p,w,h):
    cx,cy=w/2,h/2
    p.ell(cx,cy,46,34,fill=MOLTEN); p.ell(cx-8,cy-6,22,16,fill=HOT)
    p.poly([(cx-46,cy),(cx-104,cy-20),(cx-104,cy+20)],fill=(255,157,35,150))

# ---------------- CLAW ----------------
def claw(p,w,h,open_deg,y=0,impact=False,grip=False):
    cx,cy=w/2,h/2+y
    p.line([(cx,cy-190),(cx,cy-40)],GREY,10)
    p.rect(cx-46,cy-40,92,44,fill=(58,42,34,255),outline=RED,width=6,r=8)
    p.ell(cx,cy-18,12,12,fill=RED)
    for s in (-1,1):
        x1=cx+s*38; x2=cx+s*(38+open_deg)
        p.line([(x1,cy+4),(x2,cy+64),(x2-s*14,cy+108)],GREY,11)
    if grip: p.rect(cx-30,cy+52,60,52,fill=STEEL,outline=STEELS,width=5)
    if impact:
        for s in (-1,1):
            p.line([(cx+s*74,cy+112),(cx+s*126,cy+92)],HOT,7); p.line([(cx+s*60,cy+124),(cx+s*96,cy+142)],HOT,6)
def cl(o,y=0,**k): return lambda p,w,h: claw(p,w,h,o,y,**k)
def cl_rail(p,w,h):
    cx,cy=w/2,h/2
    p.rect(cx-190,cy-30,380,30,fill=STEEL,outline=STEELS,width=5); p.rect(cx-190,cy-30,380,8,fill=EDGE)
    p.rect(cx-52,cy,104,44,fill=(58,42,34,255),outline=STEELS,width=5,r=6)
    p.ell(cx-26,cy+22,12,12,fill=STEELS); p.ell(cx+26,cy+22,12,12,fill=STEELS)

# ---------------- WASP ----------------
def wasp(p,w,h,wing,fade=1.0):
    cx,cy=w/2,h/2
    col=(255,106,40,int(255*fade)); core=(255,224,46,int(255*fade))
    p.poly([(cx-24,cy-10),(cx-72,cy-10-wing),(cx-30,cy+4)],fill=(255,210,122,int(200*fade)))
    p.poly([(cx+24,cy-10),(cx+72,cy-10-wing),(cx+30,cy+4)],fill=(255,210,122,int(200*fade)))
    p.ell(cx,cy,34,28,fill=col,outline=(255,77,58,int(255*fade)),width=5)
    p.ell(cx-6,cy-6,13,11,fill=core)
def wa(wing): return lambda p,w,h: wasp(p,w,h,wing)
def wa_spawn(p,w,h):
    cx,cy=w/2,h/2
    p.ell(cx,cy+40,30,14,fill=(255,157,35,120))
    p.poly([(cx-20,cy+40),(cx,cy-52),(cx+20,cy+40)],fill=(255,157,35,170)); p.ell(cx,cy-4,20,20,fill=HOT)
def wa_diss(k):
    def f(p,w,h):
        cx,cy=w/2,h/2; a=1.0-k*0.3
        wasp(p,w,h,4,fade=a)
        random.seed(k)
        for i in range(6+k*3):
            ang=random.uniform(0,math.tau); d=40+k*26+random.uniform(0,30)
            p.ell(cx+math.cos(ang)*d,cy+math.sin(ang)*d*0.8,5,5,fill=(255,224,46,int(200*a)))
    return f

# ---------------- PLATFORM SLABS ----------------
def slab(kind):
    def f(p,w,h):
        m=42; x,y,ww,hh=m,h*0.30,w-m*2,h*0.40
        if kind=='ledge': y,hh=h*0.40,h*0.20
        if kind=='ledgerail': y,hh=h*0.40,h*0.20
        p.rect(x,y,ww,hh,fill=STEEL,outline=STEELS,width=5)
        p.rect(x,y,ww,10,fill=EDGE)
        if kind in ('wide','mid','worn'):
            for i in range(6): p.ell(x+34+i*(ww-68)/5,y+hh-26,8,8,fill=STEELS)
        if kind=='grated':
            for i in range(11): p.line([(x+16+i*(ww-32)/10,y+16),(x+16+i*(ww-32)/10,y+hh-10)],STEELS,5)
        if kind=='worn':
            p.poly([(x+ww*0.5,y+hh),(x+ww*0.62,y+hh-22),(x+ww*0.7,y+hh)],fill=(0,0,0,0),outline=STEELS,width=4)
        if kind=='ledgerail':
            for i in range(5): p.line([(x+40+i*(ww-80)/4,y),(x+40+i*(ww-80)/4,y-46)],STEELS,5)
            p.line([(x+30,y-46),(x+ww-30,y-46)],STEELS,6)
    return f

# ---------------- PROPS ----------------
def pr_vent(p,w,h):
    cx,cy=w/2,h*0.62
    p.rect(cx-96,cy-34,192,68,fill=(42,26,18,255),outline=MOLTEN,width=6,r=6)
    p.rect(cx-62,cy-60,124,30,fill=(42,26,18,255),outline=MOLTEN,width=5,r=4)
    for i in range(5): p.line([(cx-72+i*36,cy-18),(cx-72+i*36,cy+18)],MOLTEN,5)
    p.ell(cx+124,cy-10,14,14,fill=HOT)
def pr_term(p,w,h):
    cx,cy=w/2,h*0.60
    p.rect(cx-62,cy-96,124,150,fill=(15,42,48,255),outline=MINT,width=6,r=10)
    p.rect(cx-40,cy-74,80,54,fill=MINT); p.line([(cx-34,cy-2),(cx+34,cy-2)],MINT,6)
    p.line([(cx,cy+54),(cx,cy+96)],STEELS,8); p.rect(cx-44,cy+96,88,16,fill=STEEL,outline=STEELS,width=4)
def pr_shut(p,w,h):
    cx,cy=w/2,h/2
    p.rect(cx-84,cy-108,168,216,fill=(42,20,32,255),outline=RED,width=6,r=6)
    for i in range(6): p.line([(cx-70,cy-86+i*34),(cx+70,cy-86+i*34)],RED,7)
def pr_valve(p,w,h):
    cx,cy=w/2,h/2
    p.ell(cx,cy,78,78,fill=(42,20,8,255),outline=MOLTEN,width=8)
    p.line([(cx-78,cy),(cx+78,cy)],MOLTEN,9); p.line([(cx,cy-78),(cx,cy+78)],MOLTEN,9)
    p.ell(cx,cy,22,22,fill=MOLTEN)
def pr_laser(p,w,h):
    cx,cy=w/2,h*0.42
    p.rect(cx-58,cy-56,116,112,fill=(42,20,32,255),outline=RED,width=6,r=8)
    p.poly([(cx-30,cy+56),(cx+30,cy+56),(cx+14,cy+96),(cx-14,cy+96)],fill=(42,20,32,255),outline=RED,width=5)
    p.ell(cx,cy,20,20,fill=RED); p.ell(cx+78,cy-34,12,12,fill=HOT)
def pr_socket(p,w,h):
    cx,cy=w/2,h/2
    p.rect(cx-86,cy-56,172,112,fill=(15,42,48,255),outline=MOLTEN,width=6,r=8)
    p.rect(cx-40,cy-80,80,26,fill=MOLTEN)
    p.rect(cx-52,cy-24,104,52,fill=(10,20,26,255),outline=MOLTEN,width=4)
def pr_lift(p,w,h):
    cx,cy=w/2,h/2
    p.rect(cx-104,cy-124,208,248,fill=(31,20,8,255),outline=MOLTEN,width=7,r=8)
    p.rect(cx-76,cy-96,152,192,fill=(255,176,46,60))
    p.line([(cx,cy-96),(cx,cy+96)],MOLTEN,6)
    p.rect(cx-116,cy-150,232,30,fill=STEEL,outline=STEELS,width=5)
def pr_gantry(p,w,h):
    cx,cy=w/2,h/2
    p.rect(cx-150,cy-96,300,34,fill=PIPE,outline=STEELS,width=5,r=16)
    p.rect(cx-150,cy+6,300,34,fill=PIPE,outline=STEELS,width=5,r=16)
    for x in (-96,0,96): p.line([(cx+x,cy-62),(cx+x,cy+6)],STEELS,8)
    p.rect(cx-40,cy+40,80,64,fill=STEEL,outline=STEELS,width=5)

# ---------------- SINGLE SUBJECTS ----------------
def casting_mold(p,w,h):
    cx,cy=w/2,h/2
    p.poly([(cx-420,cy-70),(cx+420,cy-70),(cx+360,cy+120),(cx-360,cy+120)],fill=WARM,outline=MOLTEN,width=14)
    p.rect(cx-392,cy-96,784,34,fill=MOLTEN)
    p.rect(cx-360,cy-62,720,44,fill=HOT)
    for i in range(7): p.ell(cx-300+i*100,cy+80,20,20,fill=STEELS)
    p.line([(cx-420,cy-70),(cx-470,cy-180)],STEELS,16); p.line([(cx+420,cy-70),(cx+470,cy-180)],STEELS,16)
def mist(k):
    def f(p,w,h):
        cx,cy=w/2,h/2; random.seed(100+k)
        grow=[0.45,0.7,0.92,1.0,1.0,0.94,0.8,0.6][k]; alpha=[210,235,240,225,190,150,110,64][k]
        rise=[0,0,0,0,26,58,92,130][k]
        for i in range(16):
            ang=random.uniform(0,math.tau); d=random.uniform(0,130)*grow
            r=random.uniform(34,74)*grow
            p.ell(cx+math.cos(ang)*d,cy+math.sin(ang)*d*0.72-rise,r,r*0.86,fill=(214,246,240,int(alpha*0.5)))
        p.ell(cx,cy-rise,86*grow,70*grow,fill=(235,252,248,alpha))
    return f

# ---------------- TILING STRIPS ----------------
def strip(name,W,H,kind):
    img=Image.new('RGBA',(W*SS,H*SS),(0,0,0,0)); p=P(ImageDraw.Draw(img),SS)
    rep=W//4
    if kind=='belt':
        p.rect(0,H*0.22,W,H*0.56,fill=(21,40,48,255))
        p.rect(0,H*0.22,W,10,fill=EDGE)
        n=W//48
        for i in range(n+1): p.line([(i*48,H*0.30),(i*48,H*0.70)],STEELS,9)
        p.rect(0,H*0.74,W,6,fill=(58,88,96,255))
    else:
        p.rect(0,H*0.18,W,H*0.64,fill=(255,122,0,255))
        p.rect(0,H*0.18,W,26,fill=HOT)
        n=W//rep
        for i in range(W//64+1):
            x=i*64; p.ell(x,H*0.20,26,9,fill=(255,224,46,200))
        p.rect(0,H*0.70,W,H*0.12,fill=(150,30,0,255))
    img.resize((W,H),Image.LANCZOS).save(os.path.join(OUT,name)); return name

# ---------------- BACKGROUND ----------------
def background(name,W,H):
    # vertical gradient base
    y=np.linspace(0,1,H)[:,None]
    top=np.array([16,48,58]); mid=np.array([10,26,33]); bot=np.array([26,10,6])
    col=np.where(y<0.62,top+(mid-top)*(y/0.62),mid+(bot-mid)*((y-0.62)/0.38))
    arr=np.zeros((H,W,4),np.uint8); arr[...,:3]=np.clip(col,0,255).astype(np.uint8)[:,None,:]; arr[...,3]=255
    img=Image.fromarray(arr,'RGBA')
    big=img.resize((W*2,H*2),Image.BILINEAR); d=ImageDraw.Draw(big,'RGBA'); S=2
    rnd=random.Random(7)
    def wrapped(fn):
        # draw at x, and wrapped copies, so the plate tiles seamlessly
        for off in (-W,0,W): fn(off)
    # far tanks
    for i in range(9):
        bx=rnd.uniform(0,W); bw=rnd.uniform(150,300); bh=rnd.uniform(200,400)
        def tank(off,bx=bx,bw=bw,bh=bh):
            x=(bx+off)*S
            d.rounded_rectangle([x,(H*0.34-bh*0.25)*S,(x/S+bw)*S,(H*0.80)*S],radius=40*S,fill=(13,34,42,255))
        wrapped(tank)
    # pipes
    for i in range(14):
        px=rnd.uniform(0,W); pw=rnd.uniform(14,34); ph=rnd.uniform(140,430)
        def pipe(off,px=px,pw=pw,ph=ph):
            x=(px+off)*S
            d.rectangle([x,(H*0.10)*S,(x/S+pw)*S,(H*0.10+ph)*S],fill=(20,46,55,255))
        wrapped(pipe)
    # girders
    for i in range(7):
        gx=rnd.uniform(0,W); gy=rnd.uniform(H*0.16,H*0.58)
        def gird(off,gx=gx,gy=gy):
            x=(gx+off)*S
            d.rectangle([x,gy*S,(x/S+rnd.uniform(200,420))*S,(gy+18)*S],fill=(28,56,66,255))
        wrapped(gird)
    # furnace glow low band
    d.rectangle([0,int(H*0.80)*S,W*S,H*S],fill=(46,16,6,255))
    for i in range(10):
        gx=rnd.uniform(0,W)
        def glow(off,gx=gx):
            x=(gx+off)*S
            d.ellipse([x-90*S,(H*0.80-40)*S,x+90*S,(H*0.80+40)*S],fill=(255,110,20,45))
        wrapped(glow)
    big.resize((W,H),Image.LANCZOS).save(os.path.join(OUT,name)); return name

# ---------------- BUILD ----------------
made=[]
made.append(plate('pack-assist-v1.png',1536,1024,4,2,[pa0,pa1,pa2,pa3,pa4,pa5,pa6,pa7]))
made.append(plate('supervisor-head-v1.png',1536,1024,4,2,
    [sv(),sv(-34),sv(34),sv(0,RED),sv(0,MINT,st=True),sv_gantry,sv_close,None]))
made.append(plate('enemy-crawler-v1.png',1536,1024,4,2,
    [cr(L_A),cr(L_B),cr(L_C),cr(L_D),cr(L_B,flip=True),cr(L_A,eye=MOLTEN),cr(L_C,eye=MINT,stun=True),cr(L_A,grab=True)]))
made.append(plate('enemy-spitter-v1.png',1536,1024,4,2,
    [sp(),sp(eye=MOLTEN),sp(eye=HOT),sp(eye=HOT,flash=True),sp(eye=MOLTEN,barrel=-20),sp(eye=(120,40,30,255)),sp(shut=True),sp_slug]))
made.append(plate('enemy-claw-v1.png',1536,1024,4,2,
    [cl(34),cl(24,-20),cl(10,-20),cl(10,40),cl(6,70,impact=True),cl(4,60,grip=True),cl(24,-60),cl_rail]))
made.append(plate('enemy-wasp-v1.png',1536,1024,4,2,
    [wa(26),wa(6),wa(-18),wa(6),wa_spawn,wa_diss(0),wa_diss(1),wa_diss(2)]))
made.append(plate('furnace-platform-atlas-v1.png',1536,1024,3,2,
    [slab('wide'),slab('mid'),slab('ledge'),slab('worn'),slab('grated'),slab('ledgerail')]))
made.append(plate('furnace-prop-atlas-v1.png',1536,1024,4,2,
    [pr_vent,pr_term,pr_shut,pr_valve,pr_laser,pr_socket,pr_lift,pr_gantry]))
made.append(plate('casting-mold-v1.png',1254,1254,1,1,[casting_mold]))
made.append(plate('coolant-mist-v1.png',1536,1024,4,2,[mist(i) for i in range(8)]))
made.append(strip('conveyor-belt-v1.png',1536,256,'belt'))
made.append(strip('lava-channel-v1.png',1536,256,'lava'))
made.append(background('furnace-background-v1.png',2172,724))
for n in made:
    im=Image.open(os.path.join(OUT,n))
    print(f"{n:34} {im.size[0]:5} x {im.size[1]:5}  {im.mode}  {os.path.getsize(os.path.join(OUT,n))/1024:7.0f} KB")
