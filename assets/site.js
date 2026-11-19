(function(){
  var views=["home","about","playground","flowops","contact"];
  var links=[].slice.call(document.querySelectorAll(".toc a"));
  function mark(id){links.forEach(function(a){a.classList.toggle("on",a.dataset.to===id)})}
  function offset(){var t=document.querySelector(".top");return (t?t.getBoundingClientRect().bottom:52)+24}
  var lockY=null, lockId=null;
  // Jump so the section title sits right under the top bar
  function jumpTo(id){
    var t=document.getElementById(id);if(!t)return;
    var y=Math.max(0,t.getBoundingClientRect().top+window.pageYOffset-offset());
    window.scrollTo(0,y);
    lockY=window.pageYOffset;lockId=id;mark(id);
  }
  // Active section = last title that has passed the top bar
  function spy(){
    if(document.getElementById("view-flowops").hidden)return;
    if(lockY!==null&&Math.abs(window.pageYOffset-lockY)<3){mark(lockId);return}
    lockY=null;
    var cur=links[0]&&links[0].dataset.to, lim=offset()+8;
    links.forEach(function(a){var t=document.getElementById(a.dataset.to);if(t&&t.getBoundingClientRect().top<=lim)cur=a.dataset.to});
    mark(cur);
  }
  var ticking=false;
  window.addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;spy()})}},{passive:true});

  // Playground title: ink by default. It takes its colours and hops on hover, and for a moment on arrival at the page
  var plTitle=document.querySelector(".pl-title"), plTimer;
  function hopTitle(arrive){
    if(!plTitle)return;
    if(arrive){plTitle.classList.add("lit");clearTimeout(plTimer);plTimer=setTimeout(function(){plTitle.classList.remove("lit")},2600)}
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    plTitle.classList.remove("hop");void plTitle.offsetWidth;plTitle.classList.add("hop");
  }
  if(plTitle)plTitle.parentNode.addEventListener("mouseenter",function(){hopTitle(false)});
  var baseTitle=document.title, current=null;
  function show(){
    var h=(location.hash||"#home").slice(1), v=h, target=null, prev=current;
    if(h.indexOf("flowops-")===0){v="flowops";target=h}
    if(views.indexOf(v)<0)v="home";
    current=v;
    var view=document.getElementById("view-"+v);
    views.forEach(function(n){document.getElementById("view-"+n).hidden=(n!==v)});
    document.getElementById("site-footer").hidden=(v==="contact");
    document.querySelectorAll("[data-nav]").forEach(function(a){
      var on=a.dataset.nav===v||(v==="flowops"&&a.dataset.nav==="home");
      if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
    });
    // Name the view in the tab, so history and screen readers know where they are
    document.title=v==="home"?baseTitle:view.getAttribute("aria-label")+" · Valentina Angel";
    // A direct link to a section can land before images and fonts settle: jump again once the page has loaded
    if(target&&document.readyState!=="complete")window.addEventListener("load",function(){if(location.hash.slice(1)===h)jumpTo(target)},{once:true});
    if(target){requestAnimationFrame(function(){jumpTo(target)})}
    else if(v==="home"&&prev==="flowops"){
      // Coming back from the case lands on its card, not the top of the page
      // Scroll synchronously so a view transition snapshots the right position
      var c=document.querySelector(".feature");
      window.scrollTo(0,Math.max(0,c.getBoundingClientRect().top+window.pageYOffset-offset()));var g=c.querySelector(".go");if(g)g.focus({preventScroll:true});
    }
    else{window.scrollTo(0,0);lockY=null;if(v==="flowops")mark("flowops-summary")}
    // Arriving at Playground wakes its title up for a moment
    if(v==="playground"&&prev!=="playground")hopTitle(true);
    // After the first load, move focus to the new view's heading so assistive tech announces the change
    if(prev!==null&&prev!==v&&!target&&!(v==="home"&&prev==="flowops")){
      var hd=view.querySelector("h1");if(hd){hd.setAttribute("tabindex","-1");hd.focus({preventScroll:true})}
    }
  }
  // Changing view runs inside a View Transition where supported: the page cross-fades and the
  // FlowOps screenshot travels between the home card and the case cover. Same-view jumps and
  // reduced-motion visitors get an instant change.
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  function viewOf(hash){var h=(hash||"#home").slice(1);if(h.indexOf("flowops-")===0)return "flowops";return views.indexOf(h)<0?"home":h}
  window.addEventListener("hashchange",function(){
    if(document.startViewTransition&&!reduce.matches&&current!==null&&viewOf(location.hash)!==current){document.startViewTransition(show)}
    else show();
  });
  show();

  // Skip link: move focus to the visible view without touching the hash router
  var skip=document.querySelector(".skip");
  if(skip)skip.addEventListener("click",function(e){
    e.preventDefault();
    var hd=document.querySelector(".view:not([hidden]) h1");
    if(hd){hd.setAttribute("tabindex","-1");hd.focus()}
  });

  // Index clicks are handled here, not by the browser's anchor jump
  links.forEach(function(a){a.addEventListener("click",function(e){
    e.preventDefault();
    jumpTo(a.dataset.to);
    var t=document.getElementById(a.dataset.to);
    var h=t&&t.querySelector("h1,h2");if(h){h.setAttribute("tabindex","-1");h.focus({preventScroll:true})}
  })});

  // Enlarge screenshots
  var lb=document.getElementById("lightbox"), lbClose=document.getElementById("lb-close"), lbImg=null, lastZoom=null;
  function closeLb(){lb.hidden=true;if(lbImg)lbImg.remove();lbImg=null;document.body.style.overflow="";if(lastZoom)lastZoom.focus()}
  document.querySelectorAll(".zoom").forEach(function(z){z.addEventListener("click",function(){
    var im=z.querySelector("img");lastZoom=z;
    lbImg=document.createElement("img");lbImg.src=im.currentSrc||im.src;lbImg.alt=im.alt;lb.appendChild(lbImg);
    lb.hidden=false;document.body.style.overflow="hidden";lbClose.focus();
  })});
  lbClose.addEventListener("click",closeLb);
  lb.addEventListener("click",function(e){if(e.target===lb)closeLb()});
  document.addEventListener("keydown",function(e){
    if(lb.hidden)return;
    if(e.key==="Escape")closeLb();
    // The dialog has one control: keep keyboard focus on it while it is open
    else if(e.key==="Tab"){e.preventDefault();lbClose.focus()}
  });

  // Copy email
  var toast=document.getElementById("toast"),timer;
  function flash(msg){toast.textContent=msg;toast.hidden=false;clearTimeout(timer);timer=setTimeout(function(){toast.hidden=true},1800)}
  document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){
    var el=document.getElementById(b.dataset.copy), val=el.textContent;
    function fallback(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);flash(b.dataset.fallback||"Selected, press Ctrl+C to copy")}
    try{navigator.clipboard.writeText(val).then(function(){flash(b.dataset.msg)},fallback)}catch(e){fallback()}
  })});

  // Light / dark: follows the system until the visitor picks one, then remembers it
  var root=document.documentElement, mq=window.matchMedia("(prefers-color-scheme: dark)");
  function theme(){return root.getAttribute("data-theme")||(mq.matches?"dark":"light")}
  document.querySelectorAll("[data-theme-toggle]").forEach(function(btn){
    // The button is a switch: on means dark
    function sync(){btn.setAttribute("aria-checked",theme()==="dark"?"true":"false")}
    btn.addEventListener("click",function(){
      var next=theme()==="dark"?"light":"dark";
      root.setAttribute("data-theme",next);
      try{localStorage.setItem("theme",next)}catch(e){}
      sync();
    });
    if(mq.addEventListener)mq.addEventListener("change",sync);
    sync();
  });

  // Case screenshots below the fold settle in once as they arrive; nothing replays.
  if("IntersectionObserver" in window&&!reduce.matches){
    var sio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");sio.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
    document.querySelectorAll(".block .shot:not(.shot-hero)").forEach(function(s){s.classList.add("arrive");sio.observe(s)});
  }

  // FlowOps card: the cover flips to reveal the screenshot; only the visible face can be reached
  document.querySelectorAll("[data-flip]").forEach(function(f){
    var front=f.querySelector(".f-front"), back=f.querySelector(".f-back"), hide=f.querySelector(".flip-back");
    function set(on){
      f.classList.toggle("revealed",on);
      hide.hidden=!on;
      front.setAttribute("aria-expanded",on?"true":"false");
      if(on){back.removeAttribute("inert");front.setAttribute("inert","")}
      else{front.removeAttribute("inert");back.setAttribute("inert","")}
    }
    front.addEventListener("click",function(){set(true);setTimeout(function(){var a=back.querySelector("a");if(a)a.focus({preventScroll:true})},450)});
    hide.addEventListener("click",function(){set(false);setTimeout(function(){front.focus({preventScroll:true})},450)});
  });

  // Embedded prototype: loads on demand, scaled to the column; full screen for real use
  document.querySelectorAll("[data-proto]").forEach(function(fig){
    var stage=fig.querySelector(".proto-stage"), view=fig.querySelector(".proto-view"), launch=fig.querySelector(".proto-launch"),
        full=fig.querySelector(".proto-full"), close=fig.querySelector(".proto-close"), frame=null, BASE=1280;
    function fit(){
      if(!frame)return;
      var w=view.clientWidth, h=view.clientHeight; if(!w||!h)return;
      var b=Math.max(w,BASE), k=w/b;
      frame.style.width=b+"px"; frame.style.height=Math.round(h/k)+"px";
      frame.style.transform=k===1?"none":"scale("+k+")";
    }
    function load(){
      if(frame)return;
      frame=document.createElement("iframe");
      frame.title=fig.dataset.title; frame.src=fig.dataset.proto;
      view.appendChild(frame); view.classList.add("live"); launch.hidden=true; fit();
    }
    function setFs(on){stage.classList.toggle("fs",on);document.body.style.overflow=on?"hidden":"";requestAnimationFrame(fit)}
    launch.addEventListener("click",function(e){if(window.innerWidth<900)return;e.preventDefault();load()});
    full.addEventListener("click",function(){
      load(); setFs(true);
      if(stage.requestFullscreen){try{var p=stage.requestFullscreen();if(p&&p.catch)p.catch(function(){})}catch(e){}}
      close.focus();
    });
    close.addEventListener("click",function(){
      if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();
      setFs(false); full.focus();
    });
    document.addEventListener("fullscreenchange",function(){
      if(!document.fullscreenElement&&stage.classList.contains("fs"))setFs(false);else requestAnimationFrame(fit);
    });
    window.addEventListener("resize",fit);
    if("ResizeObserver" in window)new ResizeObserver(fit).observe(view);
  });

  // Language menu: opens under its button; closes on choice, Escape, an outside click or when focus leaves
  document.querySelectorAll("[data-lang]").forEach(function(box){
    var btn=box.querySelector(".lang-btn"), menu=box.querySelector(".lang-menu");
    function set(open){menu.hidden=!open;btn.setAttribute("aria-expanded",open?"true":"false")}
    btn.addEventListener("click",function(){var open=menu.hidden;set(open);if(open){var a=menu.querySelector("a");if(a)a.focus({preventScroll:true})}});
    document.addEventListener("click",function(e){if(!box.contains(e.target))set(false)});
    box.addEventListener("keydown",function(e){if(e.key==="Escape"&&!menu.hidden){set(false);btn.focus()}});
    box.addEventListener("focusout",function(e){if(e.relatedTarget&&!box.contains(e.relatedTarget))set(false)});
  });

  // Language switch keeps the current view and section
  document.querySelectorAll("[data-lang-link]").forEach(function(a){
    a.addEventListener("click",function(){a.href=a.getAttribute("href").split("#")[0]+location.hash});
  });
})();
