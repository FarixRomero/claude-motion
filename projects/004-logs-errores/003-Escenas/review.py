"""Review the current final video, writing only inside this project."""
from pathlib import Path
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont

PROJECT = Path(__file__).resolve().parents[1]
OUT = PROJECT / '004-Render'
TL = json.loads((PROJECT / '002-Cues/Timeline.json').read_text())
VIDEO = OUT / 'final.mp4'
frames = OUT / 'final-review-frames'
frames.mkdir(exist_ok=True)

def run(args):
    subprocess.run(args, check=True)

# Frame zero, every scene hold, every visual state change, and the closing hold.
times = sorted(set([0, TL['duration']-.15] + [(s['start']+s['end'])/2 for s in TL['scenes']] + [min(v['at']+.35,TL['duration']-.15) for k,v in TL['events'].items() if not k.endswith('.enter')]))
for i,t in enumerate(times):
    run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(VIDEO),'-frames:v','1','-vf','scale=360:640',str(frames/f'{i:02d}.png')])
    file = frames/f'{i:02d}.png'
    image = Image.open(file)
    draw = ImageDraw.Draw(image)
    font_path = Path('/usr/share/fonts/truetype/noto/NotoMono-Regular.ttf')
    font = ImageFont.truetype(str(font_path),12) if font_path.exists() else ImageFont.load_default(size=12)
    draw.rectangle((7,28,94,46),fill='#090b18')
    draw.text((10,30),f't={t:.2f}',font=font,fill='#f5f7ff')
    image.save(file)
for group in range((len(times)+7)//8):
    count = min(8,len(times)-group*8)
    run(['ffmpeg','-v','error','-y','-framerate','1','-start_number',str(group*8),'-i',str(frames/'%02d.png'),'-vf',f'tile=4x2:nb_frames={count}:padding=5:color=0x090b18','-frames:v','1',str(OUT/f'final-sheet-{group+1}.png')])
marks = ','.join(f'drawbox=x={round(v["at"]/TL["duration"]*1800)}:y=0:w=2:h=ih:color=0xff602e@0.8:t=fill' for k,v in TL['events'].items() if not k.endswith('.enter'))
run(['ffmpeg','-v','error','-y','-i',str(VIDEO),'-filter_complex',f'color=c=0x090b18:s=1800x280:d=1[bg];[0:a]aformat=channel_layouts=mono,showwavespic=s=1800x280:scale=sqrt:colors=0x9db3ce[w];[bg][w]overlay=format=auto,{marks}','-frames:v','1',str(OUT/'final-wave.png')])
run(['ffmpeg','-v','error','-y','-ss',str(TL['events']['fire.reveal']['at']+.85),'-i',str(VIDEO),'-frames:v','1',str(OUT/'poster.png')])
(OUT/'review-times.json').write_text(json.dumps(times,indent=2)+'\n')
print(f'{len(times)} captured timestamps; sheets and waveform in {OUT}')
