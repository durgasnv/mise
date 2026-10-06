import { useEffect,useRef,useState } from 'react';
export function HeroVisual() {
  const host=useRef(null),[ready,setReady]=useState(false);
  useEffect(()=>{
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let disposed=false,cleanup=null,idle=null,generation=0;
    function stop(){generation++;if(idle!==null){if(window.cancelIdleCallback) cancelIdleCallback(idle);else clearTimeout(idle);idle=null;}cleanup?.();cleanup=null;}
    function update(){
      stop();setReady(false);if(!started || motion.matches || navigator.connection?.saveData) return;
      const version=generation;
      const load=async()=>{
        idle=null;
        try {
          const {createKitchenScene}=await import('../lib/createKitchenScene.js');
          if(disposed || version!==generation || !host.current) return;
          cleanup=createKitchenScene(host.current,()=>{if(!disposed && version===generation)setReady(true);},()=>{if(!disposed){setReady(false);stop();}});
        } catch {if(!disposed && version===generation)setReady(false);}
      };
      idle=window.requestIdleCallback ? requestIdleCallback(load,{timeout:1200}) : setTimeout(load,0);
    }
    // Avoid downloading a renderer before the illustration is near the viewport.
    let started=false;
    const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting && !started){started=true;update();observer.disconnect();}},{rootMargin:'150px'});
    observer.observe(host.current);motion.addEventListener('change',update);
    return()=>{disposed=true;stop();observer.disconnect();motion.removeEventListener('change',update);};
  },[]);
  return <div className={`hero-visual hero-plate ${ready?'hero-plate-ready':''}`} role="img" aria-label="An illustrated plate of pasta, tomatoes and herbs">
    <img className="hero-plate-fallback" src="/hero-plate.svg" alt="" width="700" height="800" />
    <div ref={host} className="hero-scene" aria-hidden="true" data-state={ready?'ready':'fallback'} />
    <span className="ingredient-note ingredient-note-one">Tonight's odds & ends</span><span className="ingredient-note ingredient-note-two">One very good dinner</span>
  </div>;
}
