let audio;
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{// انتظار الامر من المنبه او من ازرار اشعار الادان
    if(message.target=='offscreen-audio'){// تشغيل صوت الاذان
        startAdan()
    }else if(message.action==='STOP_AUDIO'){// ايقاف صوت الاذان
        playing=false;
        audio.pause();
        audio.src='';
        audio.load();
    }
});

function startAdan() {
    audio = new Audio('/ui/assets/media/Adhan.mp3');// تحميل ملف صوت الاذان
    audio.volume = 0.5;
    audio.onended = () => {// ارسال امر باغلاق الاشعار عند انتهاء الاذان
        chrome.runtime.sendMessage({ target: "closeNotification" });
    };
    audio.play();
    playing = true;
   
}
