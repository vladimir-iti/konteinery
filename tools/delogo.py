import cv2, numpy as np, sys
def delogo(path):
    im=cv2.imread(path)
    if im is None:
        from PIL import Image; im=cv2.cvtColor(np.array(Image.open(path).convert('RGB')),cv2.COLOR_RGB2BGR)
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
    h,s,v=cv2.split(hsv)
    red=(((h<=7)|(h>=170))&(s>90)&(v>150))
    teal=((h>=42)&(h<=80)&(s>26)&(v>80))
    m=((red|teal).astype(np.uint8))*255
    k=max(3,im.shape[1]//300)
    m=cv2.dilate(m,np.ones((k,k),np.uint8),iterations=3)
    # close gaps so text becomes one blob
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((k*4,k*4),np.uint8))
    out=cv2.inpaint(im,m,max(5,k*2),cv2.INPAINT_TELEA)
    return out,m
if __name__=='__main__':
    for p in sys.argv[1:-1]:
        out,m=delogo(p)
        cv2.imwrite(sys.argv[-1]+'/'+p.split('/')[-1].rsplit('.',1)[0]+'.png',out)
