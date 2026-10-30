(() => {
  'use strict';
  let detectorPromise;
  const OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
  const EYES = [[33,160,158,133,153,144],[362,385,387,263,373,380]];
  const LIPS = [61,40,37,0,267,270,291,321,314,17,84,91];
  const BROWS = [[70,63,105,66,107,55,65,52,53,46],[336,296,334,293,300,276,283,282,295,285]];
  function getDetector() {
    if (!detectorPromise) {
      const base = new URL('vendor/mediapipe/', document.baseURI).href;
      detectorPromise = import(base + 'vision_bundle.mjs').then(async ({FaceLandmarker, FilesetResolver}) => {
        const vision = await FilesetResolver.forVisionTasks(base + 'wasm');
        return FaceLandmarker.createFromOptions(vision, {baseOptions:{modelAssetPath:base+'face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:0.5});
      }).catch(error => { detectorPromise=null; throw error; });
    }
    return detectorPromise;
  }
  function polygon(ctx, points, ids, width, height, expansion=1) {
    const cx=ids.reduce((sum,id)=>sum+points[id].x,0)/ids.length, cy=ids.reduce((sum,id)=>sum+points[id].y,0)/ids.length;
    ctx.beginPath();
    ids.forEach((id,i)=>{ const p=points[id],x=(cx+(p.x-cx)*expansion)*width,y=(cy+(p.y-cy)*expansion)*height;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y); });
    ctx.closePath();ctx.fill();
  }
  function createMask(points,width,height) {
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';polygon(ctx,points,OVAL,width,height,0.97);
    ctx.globalCompositeOperation='destination-out';
    [...EYES,LIPS,...BROWS].forEach(ids=>polygon(ctx,points,ids,width,height,1.3));
    const soft=document.createElement('canvas');soft.width=width;soft.height=height;
    const blend=soft.getContext('2d',{willReadFrequently:true});blend.filter='blur('+Math.max(1.5,width/260)+'px)';blend.drawImage(canvas,0,0);
    return blend.getImageData(0,0,width,height).data;
  }
  function renderFoundation(source,mask,hex,coverage) {
    const digits=hex.slice(1);const full=digits.length===3?digits.split('').map(c=>c+c).join(''):digits;
    const rgb=full.match(/.{2}/g).map(c=>parseInt(c,16));
    const result=new ImageData(new Uint8ClampedArray(source.data),source.width,source.height), original=source.data,output=result.data;
    let sum=0,total=0;
    for(let i=0;i<original.length;i+=4){const weight=mask[i+3]/255;if(weight>0.5){sum+=(original[i]*0.2126+original[i+1]*0.7152+original[i+2]*0.0722)*weight;total+=weight;}}
    const average=total?sum/total:128;
    for(let i=0;i<original.length;i+=4){
      const alpha=mask[i+3]/255*coverage;if(alpha<=0)continue;
      const light=original[i]*0.2126+original[i+1]*0.7152+original[i+2]*0.0722,texture=Math.max(0.45,Math.min(1.5,light/Math.max(average,1)));
      for(let c=0;c<3;c++)output[i+c]=original[i+c]*(1-alpha)+Math.min(255,rgb[c]*texture)*alpha;
    }
    return result;
  }
  window.criarProvadorBase=function(root,produto,tons,escolherTom){
    if(!tons.length)return null;
    const section=document.createElement('section');section.id='provadorBase';section.className='pv';section.setAttribute('aria-labelledby','pvTitulo');
    section.innerHTML=`
      <header class="pv-header"><div><span class="secao-eyebrow">Encontre o seu tom</span><h2 id="pvTitulo">Sua pele. <em>Sua base.</em></h2><p>Experimente uma tonalidade e arraste a linha para comparar com a sua pele natural.</p></div><span class="pv-chip">Provador virtual</span></header>
      <div class="pv-layout"><div class="pv-visual">
        <div class="pv-empty" data-pv="empty"><span class="pv-face" aria-hidden="true">◯</span><h3>Vamos encontrar o seu tom?</h3><p>Escolha uma foto de frente, com boa iluminação e sem filtros, ou tire uma agora.</p><span class="pv-empty-note">Uma pessoa por foto · JPG, PNG, WebP ou AVIF · até 12 MB</span></div>
        <div class="pv-camera" data-pv="camera" hidden><video data-pv="video" autoplay muted playsinline aria-label="Prévia da câmera"></video><div class="pv-camera-actions"><button type="button" class="btn btn-primary" data-pv="capture" disabled>Tirar foto</button><button type="button" class="btn btn-ghost" data-pv="cancel">Fechar câmera</button></div></div>
        <div class="pv-comparison" data-pv="comparison" hidden>
          <canvas data-pv="natural" role="img" aria-label="Sua foto original, sem base virtual"></canvas>
          <canvas class="pv-applied" data-pv="applied" role="img" aria-label="Sua foto com a tonalidade de base simulada"></canvas>
          <span class="pv-side pv-side-left" aria-hidden="true">Pele natural</span><span class="pv-side pv-side-right" aria-hidden="true">Com base</span>
          <span class="pv-line" aria-hidden="true"><span>‹ ›</span></span>
          <input class="pv-slider" data-pv="divider" type="range" min="0" max="100" value="50" aria-label="Divisão: pele natural à esquerda e base à direita">
        </div><p class="pv-drag-hint" data-pv="drag" hidden>↔ Arraste a linha ou use as setas do teclado para comparar.</p>
      </div><div class="pv-controls">
        <h3>Experimente no seu rosto</h3><p class="pv-privacy">Sua foto fica apenas neste navegador. Ela não é enviada nem salva no site.</p>
        <div class="pv-actions"><button type="button" class="btn btn-primary" data-pv="open">Usar câmera</button><button type="button" class="btn btn-ghost" data-pv="upload">Enviar foto</button><input data-pv="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden></div>
        <p class="pv-status" data-pv="status" role="status" aria-live="polite">Escolha como deseja experimentar.</p>
        <fieldset class="pv-tones"><legend>Tom: <strong data-pv="toneName"></strong></legend><div class="pv-swatches" data-pv="swatches"></div></fieldset>
        <label class="pv-coverage">Cobertura da simulação <output data-pv="coverageLabel">50%</output><input data-pv="coverage" type="range" min="15" max="75" value="50" step="5"></label>
        <p class="pv-note">Prévia aproximada: a iluminação, a câmera e a tela alteram a percepção da cor. Compare também com o pescoço em luz natural.</p>
        <button type="button" class="pv-clear" data-pv="clear" hidden>Remover minha foto</button>
      </div></div>`;
    root.querySelector('.produto-topo').after(section);
    const $=name=>section.querySelector('[data-pv="'+name+'"]');
    const natural=$('natural'),applied=$('applied'),comparison=$('comparison'),video=$('video');
    let tone=tons[0],source=null,mask=null,stream=null,operation=0,cameraOperation=0,busy=false;
    const status=(message,error=false)=>{$('status').textContent=message;$('status').classList.toggle('pv-error',error);};
    function setBusy(value){busy=value;section.setAttribute('aria-busy',String(value));$('open').disabled=value;$('upload').disabled=value;$('capture').disabled=value||!stream||!video.videoWidth;}
    function stopCamera(){
      cameraOperation++;if(stream)stream.getTracks().forEach(track=>track.stop());
      stream=null;video.pause();video.srcObject=null;$('camera').hidden=true;$('capture').disabled=true;comparison.hidden=!source;$('empty').hidden=Boolean(source);
    }
    function repaint(){if(source&&mask)applied.getContext('2d').putImageData(renderFoundation(source,mask,tone.cor,Number($('coverage').value)/100),0,0);}
    const swatches=[];
    tons.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='pv-swatch';b.style.setProperty('--tom',t.cor);b.setAttribute('aria-label','Experimentar '+t.nome);b.title=t.nome;const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');const label=document.createElement('small');label.textContent=t.nome;b.append(dot,label);b.addEventListener('click',()=>escolherTom(i));$('swatches').append(b);swatches.push(b);});
    function selecionarTom(t){
      if(!t||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(t.cor))return;
      tone=t;$('toneName').textContent=t.nome;swatches.forEach((b,i)=>b.setAttribute('aria-pressed',String(tons[i]===t)));
      applied.setAttribute('aria-label','Sua foto com base virtual no tom '+t.nome);repaint();
    }
    function setDivision(){const v=Number($('divider').value);comparison.style.setProperty('--division',v+'%');$('divider').setAttribute('aria-valuetext',v+'% de pele natural à esquerda; '+(100-v)+'% com base à direita');}
    $('divider').addEventListener('input',setDivision);
    $('coverage').addEventListener('input',()=>{$('coverageLabel').textContent=$('coverage').value+'%';repaint();});
    async function processPhoto(image,mirror=false){
      const ticket=++operation;stopCamera();setBusy(true);$('clear').hidden=false;status('Preparando o provador e identificando o rosto…');
      try{
        const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
        if(!width||!height||width*height>40000000)throw new Error('Escolha uma foto com até 40 megapixels.');
        const scale=Math.min(1,1100/Math.max(width,height)),buffer=document.createElement('canvas');buffer.width=Math.round(width*scale);buffer.height=Math.round(height*scale);
        const ctx=buffer.getContext('2d',{willReadFrequently:true});if(mirror){ctx.translate(buffer.width,0);ctx.scale(-1,1);}ctx.drawImage(image,0,0,buffer.width,buffer.height);
        const detector=await getDetector();if(ticket!==operation)return;
        const faces=detector.detect(buffer).faceLandmarks;
        if(faces.length!==1)throw new Error(faces.length?'Use uma foto com apenas uma pessoa para comparar o tom.':'Não encontrei um rosto. Tente uma foto de frente e com mais luz.');
        const points=faces[0],xs=OVAL.map(i=>points[i].x),ys=OVAL.map(i=>points[i].y);
        if(Math.max(...xs)-Math.min(...xs)<0.15||Math.max(...ys)-Math.min(...ys)<0.2)throw new Error('Aproxime um pouco o rosto e tente outra foto.');
        const nextSource=ctx.getImageData(0,0,buffer.width,buffer.height),nextMask=createMask(points,buffer.width,buffer.height);
        if(ticket!==operation)return;source=nextSource;mask=nextMask;
        natural.width=applied.width=buffer.width;natural.height=applied.height=buffer.height;
        natural.getContext('2d').putImageData(source,0,0);repaint();comparison.hidden=false;$('empty').hidden=true;$('drag').hidden=false;
        status('Foto pronta! Escolha um tom e arraste a linha para comparar.');
      }catch(e){if(ticket===operation)status(e.message&&!/fetch|wasm|model|network/i.test(e.message)?e.message:'Não foi possível iniciar o provador. Recarregue a página e tente novamente.',true);}
      finally{if(ticket===operation){setBusy(false);$('clear').hidden=!source;}}
    }
    $('upload').addEventListener('click',()=>$('file').click());
    $('file').addEventListener('change',async()=>{
      const file=$('file').files[0];$('file').value='';if(!file)return;
      if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>12*1024*1024){status('Escolha uma imagem JPG, PNG, WebP ou AVIF de até 12 MB.',true);return;}
      const ticket=++operation,url=URL.createObjectURL(file);setBusy(true);
      try{const image=new Image();image.src=url;await image.decode();if(ticket===operation)await processPhoto(image);}
      catch{if(ticket===operation)status('Não consegui abrir essa imagem. Tente outro arquivo.',true);}
      finally{URL.revokeObjectURL(url);if(ticket===operation)setBusy(false);}
    });
    $('open').addEventListener('click',async()=>{
      if(busy)return;
      if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){status('Para usar a câmera, abra o site em HTTPS ou localhost. Você também pode enviar uma foto.',true);return;}
      stopCamera();const ticket=cameraOperation;setBusy(true);status('Permita o acesso à câmera no navegador…');
      try{
        const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:1280}},audio:false});
        if(ticket!==cameraOperation){media.getTracks().forEach(track=>track.stop());return;}
        stream=media;video.srcObject=stream;$('camera').hidden=false;$('empty').hidden=true;comparison.hidden=true;
        await video.play();if(ticket!==cameraOperation)return;
        $('capture').disabled=!video.videoWidth;status('Olhe de frente para a câmera e clique em “Tirar foto”.');
      }catch(e){if(ticket===cameraOperation){stopCamera();status(e.name==='NotAllowedError'?'A câmera não foi autorizada. Libere a permissão no navegador ou envie uma foto.':e.name==='NotFoundError'?'Nenhuma câmera encontrada. Você pode enviar uma foto.':'Não foi possível abrir a câmera. Feche outros aplicativos ou envie uma foto.',true);}}
      finally{if(ticket===cameraOperation||!stream)setBusy(false);}
    });
    video.addEventListener('loadeddata',()=>{if(stream&&!busy)$('capture').disabled=false;});
    $('capture').addEventListener('click',()=>{if(!stream||!video.videoWidth||busy)return;const shot=document.createElement('canvas');shot.width=video.videoWidth;shot.height=video.videoHeight;shot.getContext('2d').drawImage(video,0,0);processPhoto(shot,true);});
    $('cancel').addEventListener('click',()=>{stopCamera();setBusy(false);status(source?'Sua foto está pronta para comparar.':'Câmera fechada. Você pode enviar uma foto.');});
    $('clear').addEventListener('click',()=>{operation++;stopCamera();source=mask=null;natural.width=applied.width=natural.height=applied.height=0;comparison.hidden=true;$('empty').hidden=false;$('drag').hidden=true;$('clear').hidden=true;$('divider').value='50';setDivision();setBusy(false);status('Foto removida. Escolha outra foto quando quiser.');});
    window.addEventListener('pagehide',()=>{operation++;stopCamera();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream){stopCamera();setBusy(false);status('Câmera fechada. Clique em “Usar câmera” para reabrir.');}});
    selecionarTom(tone);setDivision();
    if(location.hash==='#provadorBase')requestAnimationFrame(()=>section.scrollIntoView({block:'start'}));
    return {selecionarTom};
  };
})();