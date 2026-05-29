//background.JS
const storage = chrome.storage.local;
function getTodaysDate(){// الحصول على التاريخ الهجري
    const hijriFormatter = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura',
        {weekday:'long',day:'numeric',month:'numeric',year:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}
    );
    const date = hijriFormatter.formatToParts(new Date());
    return {nhar:date[0],yawm:date[2],chahr:date[4],sana:date[6],sa3a:date[10],da9i9a:date[12],tanya:date[14]};
}

async function getGeoLoc(){// طلب الحصول على الاحداثيات
    try{
        const response = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client");
        const data = await response.json()
        const geoloc = {lat:data.latitude,lon:data.longitude,city:data.city,country:data.countryName};
        storage.set({cords:geoloc});
        return geoloc;
    }catch(e){
        return null;
    }
}

async function fetchMonthCalendar(geoloc,tarikh) { // طلب الحصول على حصة الشهر عن طريق الاحداثيات
    const url = `https://api.aladhan.com/v1/hijriCalendar/${tarikh.sana.value}/${tarikh.chahr.value}?latitude=${geoloc.lat}&longitude=${geoloc.lon}`;
    const response = await fetch(url);
    if(response.ok){
        const json = await response.json();
        const alarms = await storage.get({alarms:null});
        const lang = await storage.get({lang:'ar'});
        storage.clear();
        const name = `_${tarikh.chahr.value}${tarikh.sana.value}`;
        storage.set({[name]:json['data']});
        storage.set({cords:geoloc});
        storage.set(alarms);
        storage.set(lang);
        return json['data'];
    }
    return null;
}

function getTodaysPrayers(timings) {// تحويل اوقات الصلاة من نص '4:30' الى مصفوفة ارقام [دقائق,ساعات]  [4,30]
    const prayers=[];
    [timings.Fajr,timings.Sunrise,timings.Dhuhr,timings.Asr,timings.Maghrib,timings.Isha].forEach((timing)=>{ // استعمال substring لإزالة اي اشارة للتوقيت الصيفي 
        prayers.push([Number(timing.substring(0,2)),Number(timing.substring(3,5))])
    })
    return prayers;
}

chrome.runtime.onInstalled.addListener(async ()=>{// مباشرة بعد تثبيت الاضافة في المتصفح
    console.log('onInstalled');
    storage.set({alarms:[true,false,true,true,true,true]}); // مصفوفة تنبيهات الصلاوات مفعلة تلقائيا
    storage.set({lang:"ar"});

    const date = getTodaysDate();
    const monthYear = `_${date.chahr.value}${date.sana.value}`;
    let monthCalendar,geoloc;
    
    geoloc = await getGeoLoc(); // طلب الحصول على الاحداثيات وتخزينها
    if (geoloc !== null) {
        monthCalendar = await fetchMonthCalendar(geoloc, date); // طلب الحصول على حصة الشهر الحالي
    }
    const todaysPrayers = getTodaysPrayers(monthCalendar[parseInt(date.yawm.value)-1].timings); // الحصول على اوقات صلوات اليوم
    for (let i = 0; i < 6; i++) {
        const time = new Date();
        time.setHours(todaysPrayers[i][0], todaysPrayers[i][1]);
        chrome.alarms.create(`${i}`, { when: time.getTime() });// برمجة توقيت المنبه لوقت الاذان
    }
});


// ايقاف صوت الاذان عند الضغط على زر ايقاف او الضغط على الاشعار او اغلاقه"
chrome.notifications.onClicked.addListener(()=>{
    chrome.runtime.sendMessage({ action: "STOP_AUDIO" });
});
chrome.notifications.onButtonClicked.addListener(()=>{
    chrome.runtime.sendMessage({ action: "STOP_AUDIO" });
});
chrome.notifications.onClosed.addListener(()=>{
    chrome.runtime.sendMessage({ action: "STOP_AUDIO" });
});
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{//اغلاق الاشعار عند اكتمال نهاية صوت الاذان
    if(message.target==='closeNotification'){
        chrome.notifications.clear("notification");
    }
});

chrome.runtime.onStartup.addListener(async ()=>{//عند فتح المتصفح
    const date = getTodaysDate();// توقيت اليوم
    const monthYear = `_${date.chahr.value}${date.sana.value}`;
    let monthCalendar = await storage.get({[monthYear]: null}); // حصة الشهر
    let prayerAlarms = await storage.get({'alarms':null}); // مصفوفة المنبهات
    let geoloc = await storage.get({"cords":null}); // الاحداثيات
    if(monthCalendar[monthYear]===null){
        if(geoloc.cords!==null){
            monthCalendar = await fetchMonthCalendar(geoloc.cords,date);
        }else{
            geoloc = await getGeoLoc();
            if(geoloc!==null){
                monthCalendar = await fetchMonthCalendar(geoloc,date);
            }
        }
    }

    prayerAlarms = prayerAlarms.alarms;
    const todaysPrayers = getTodaysPrayers(monthCalendar[monthYear][parseInt(date.yawm.value)-1].timings);
    chrome.alarms.clearAll(()=>{// حذف كل التنبيهات المبرمجة مسبقا
        for (let i = 0; i < prayerAlarms.length; i++) {
            const alarm = prayerAlarms[i];
            if(alarm){
                const time = new Date();
                time.setHours(todaysPrayers[i][0],todaysPrayers[i][1]);
                chrome.alarms.create(`${i}`,{when:time.getTime()}); // برمجة المنبه لكل صلاة
            }
        }
    });
});


chrome.alarms.onAlarm.addListener(async (alarm)=>{// عند اطلاق المنبه
    const lang = await storage.get({lang:'ar'});
    const date = getTodaysDate();
    const monthYear = `_${date.chahr.value}${date.sana.value}`;
    const monthCalendar = await storage.get({ [monthYear]: null });
    const prayer = getTodaysPrayers(monthCalendar[monthYear][parseInt(date.yawm.value) - 1].timings)[Number(alarm.name)];
    const prayerNames = lang.lang==='ar'? ['الفجر', '', 'الظهر', 'العصر', 'المغرب', 'العشاء'] : ['Fajr', '', 'Duhr', 'Asr', 'Maghreb', 'Isha'];
    const prayerTime = new Date();
    prayerTime.setHours(prayer[0], prayer[1]);
    const currentTime = new Date();
    if (prayerTime.getTime() + 300000 > currentTime) { // ادا كان وقت الاذان لم يمر بـ 5 دقائق او اكثر (30 الف ميلي ثانية)
        const hasDocument = await chrome.offscreen.hasDocument();
        if (!hasDocument) {  // تحميل ملف (offscreen.html) ان لم يكن محمل مسبقا الذي يحتوي على دالة تشغيل صوت الاذان
            await chrome.offscreen.createDocument({
                url: '/ui/offscreen.html',
                reasons: ['AUDIO_PLAYBACK'],
                justification: 'Starting adan, call for prayer',
            });
        }
        chrome.runtime.sendMessage({ // ارسال رسالة الى ملف offscreen.js لكي يشغل الاذان
            target: 'offscreen-audio'
        });
        if(lang.lang==='ar'){
            chrome.notifications.create('notification', { // اظهار اشعار للتنبه بوقت الاذان
            type: "basic",
            iconUrl: "/icon/128.png",
            title: "الاذان",
            message: `حان وقت اذان صلاة ${prayerNames[Number(alarm.name)]}`,
            buttons: [ { title: 'ايقاف' }],
            priority: 1
        });
        }else{
            chrome.notifications.create('notification', {
            type: "basic",
            iconUrl: "/icon/128.png",
            title: "Adhan",
            message: `It's time for ${prayerNames[Number(alarm.name)]} prayer`,
            buttons: [ { title: 'Close' }],
            priority: 1
        });
        }
    }
});
