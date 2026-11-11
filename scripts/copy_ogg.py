import os
import shutil

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = r"C:\Users\Administrator\AppData\Local\Temp\gm-assets\fire-1.ogg"
dst_dir = os.path.join(root, "public")
os.makedirs(dst_dir, exist_ok=True)
dst = os.path.join(dst_dir, "fire-crackle.ogg")
shutil.copyfile(src, dst)
with open(dst, "rb") as f:
    print(f.read(4), os.path.getsize(dst))
probe = os.path.join(root, "scripts", "probe_pb.py")
if os.path.exists(probe):
    os.remove(probe)
    print("removed probe")
