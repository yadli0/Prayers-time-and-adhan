let mainSection,calendarSection,lang;
// اختصار لتقليص حجم البرنامج
function sa(e,a,v){e.setAttribute(a,v)}
function gebId(id){return document.getElementById(id)}

function getMonthName(n){
    if(lang.lang==='ar'){return['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى اﻷولى','جمادة الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'][n-1]}
    else{ return['Muharram','Safar',"Rabi' al-Awwal","Rabi' al-Thani",'Jumada al-Awwal','Jumada al-Thani','Rajab',"Sha'aban",'Ramadan','Shawwal',"Dhu al-Qi'dah","Dhu al-Hijjah"][n-1] } 
}

const storage = chrome.storage.local;

function getCurrentTimeInMinutes() {
    const date= new Date();
    return [date.getHours()*60+date.getMinutes(),date.getSeconds()];
}

const prayerIcons=['fajr','du7a_maghrib','duhr_3asr','duhr_3asr','du7a_maghrib','3icha'];
let prayerNames,intervalId;
function stupCountDown(currentTimeInMinutes,prayerMinutes,currentSeconds){// العداد العكسي
    if(currentTimeInMinutes<prayerMinutes){// بقي على الصلا كذا ساعة و دقيقة وثانية
        let leftMinutes = prayerMinutes-currentTimeInMinutes;
        let h = parseInt(leftMinutes/60);
        let m = leftMinutes%60;
        let s = 60-currentSeconds;
        let displayHours,displyMinutes,displaySeconds;
        const countDownElement=gebId('countDown');
        if(s==60){s=59}if(m==60){m=0}
        if(s<10){displaySeconds=`0${s}`}else{displaySeconds=s}
        if(m<10){displyMinutes=`0${m}`}else{displyMinutes=m}
        if(h<10){displayHours=`0${h}`}else{displayHours=h}
        countDownElement.textContent=`${displayHours}:${displyMinutes}:${displaySeconds}-`;
        clearInterval(intervalId);
        intervalId = setInterval(() => {
            s--;
            if(s===-1){
                s=59;m--;
                if(m==-1){
                    m=59;h--;
                    if(h===-1){h=0}
                }
            }
            if(s<10){displaySeconds=`0${s}`}else{displaySeconds=s}
            if(m<10){displyMinutes=`0${m}`}else{displyMinutes=m}
            if(h<10){displayHours=`0${h}`}else{displayHours=h}
            countDownElement.textContent=`${displayHours}:${displyMinutes}:${displaySeconds}-`;
        }, 1000);
    }else if(currentTimeInMinutes<prayerMinutes+20){//إذا مر على الاذان اقل من 20 دقيقة 
        let passedMinutes = currentTimeInMinutes-prayerMinutes;
        let h = parseInt(passedMinutes/60);
        let m = passedMinutes%60;
        let s = currentSeconds;
        let displyMinutes,displaySeconds;
        const countDownElement=gebId('countDown');
        if(s<10){displaySeconds=`0${s}`}else{displaySeconds=s}
        if(m<10){displyMinutes=`0${m}`}else{displyMinutes=m}
        countDownElement.textContent=`00:${displyMinutes}:${displaySeconds}`;
        intervalId = setInterval(() => {
            s++;
            if(s===60){
                s=0;m++;
                if(m===20){clearInterval(this)}
            }
            if(s<10){displaySeconds=`0${s}`}else{displaySeconds=s}
            if(m<10){displyMinutes=`0${m}`}else{displyMinutes=m}
            countDownElement.textContent=`00:${displyMinutes}:${displaySeconds}`;
        }, 1000);
    }else{
        stupCountDown(currentTimeInMinutes-1440,prayerMinutes,currentSeconds)
    }
}

function setupCurrentPrayer(prayers){
    const currentTimeInMinutes = getCurrentTimeInMinutes();
    const prayer = [prayers.Fajr,prayers.Sunrise,prayers.Dhuhr,prayers.Asr,prayers.Maghrib,prayers.Isha];
    let currentPrayer=null;
    for (let i = 0; i < prayer.length; i++) {
        const p = prayer[i];
        const prayerMinutes = Number(p.substring(0,2))*60+Number(p.substring(3,5));
        if(currentTimeInMinutes[0]<=prayerMinutes+20){
            if(currentTimeInMinutes[0]>=prayerMinutes){
                gebId('details').textContent = lang.lang==='ar'?'مر على الاذان':"Time passed since the call for prayer";
            }else{
                gebId('details').textContent = lang.lang==='ar' ?'بقي على الاذان':"Time left until next prayer";
            }
            currentPrayer = prayerNames[i];
            gebId('nextPrayerName').textContent=prayerNames[i];
            sa(gebId('prayer_icon'),'src',`assets/img/${prayerIcons[i]}.svg`);
            sa(gebId(prayerNames[i]),'current','');
            stupCountDown(currentTimeInMinutes[0],prayerMinutes,currentTimeInMinutes[1]);
            break
        }
    }
    if(currentPrayer===null){
        gebId('nextPrayerName').textContent=prayerNames[0];
        sa(gebId('prayer_icon'),'src',`assets/img/${prayerIcons[0]}.svg`);
        const p = prayer[0];
        const prayerMinutes = Number(p.substring(0,2))*60+Number(p.substring(3,5));
        stupCountDown(currentTimeInMinutes[0],prayerMinutes,currentTimeInMinutes[1]);
    }
}

function timesElement() {const timesDiv = document.createElement('ul');timesDiv.className = 'times';return timesDiv;}

async function setupMonthCalendar(date,prayers){
    const monthYear = `_${date.chahr.value}${date.sana.value}`;
    prayers=prayers[monthYear];
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < prayers.length; i++) {
        const prayer = prayers[i].timings;
        const timesDiv = timesElement();
        if(i+1===Number(date.yawm.value)){sa(timesDiv,'today','')}
        timesDiv.innerHTML = `
            <li>${i + 1}</li><li>${prayer.Fajr.slice(0,5)}</li><li d>${prayer.Sunrise.slice(0,5)}</li>
            <li>${prayer.Dhuhr.slice(0,5)}</li><li d>${prayer.Asr.slice(0,5)}</li>
            <li>${prayer.Maghrib.slice(0,5)}</li><li d>${prayer.Isha.slice(0,5)}</li>
        `;
        fragment.appendChild(timesDiv);
    }
    const list=gebId('list');
    const prayersNameColumn = gebId('month_prayers');
    prayersNameColumn.innerHTML=`
                <li></li>
                <li d>${prayerNames[0]}</li>
                <li>${prayerNames[1]}</li>
                <li d>${prayerNames[2]}</li>
                <li>${prayerNames[3]}</li>
                <li d>${prayerNames[4]}</li>
                <li>${prayerNames[5]}</li>
    `;
    list.innerHTML = '';
    list.appendChild(fragment);
    gebId('close').onclick =()=>{
        calendarSection.style.cssText='display:none';
        mainSection.style.cssText='display:block';
    };
    gebId('month_year').textContent = `${getMonthName(date.chahr.value)} ${date.sana.value}`;
}


//MARK:alarms
function setupAlarms(prayers,alarms) {
    chrome.alarms.clearAll(()=>{
        let currentTime= new Date();
        currentTime = currentTime.getTime();
        for (let i = 0; i < prayers.length; i++) {
            const alarm = alarms[i];
            if(alarm){
                const time = new Date();
                time.setHours(Number(prayers[i].substring(0,2)),Number(prayers[i].substring(3,5)))
                if(time.getTime()+300000>currentTime){
                    chrome.alarms.create(`${i}`,{when:time.getTime()});
                }
            }
          }
    });
}


function setupPrayers(prayers,alarms) {
    const f = document.createDocumentFragment();
    const prayer = [prayers.Fajr,prayers.Sunrise,prayers.Dhuhr,prayers.Asr,prayers.Maghrib,prayers.Isha];
    for (let i = 0; i < 6; i++) {
        const listItem = document.createElement('li');
        const alarm = alarms[i] ?"on" :"off";
        listItem.id = prayerNames[i];
        listItem.innerHTML=`
            <span class="ic"><img src="assets/img/${prayerIcons[i]}.svg"></span>
            <span class="name">${prayerNames[i]}</span>
            <span class="time">${prayer[i].slice(0,5)}</span>
            <span class="bell"><img active="${alarm}" src="assets/img/bell_${alarm}.svg"></span>
        `;
        listItem.querySelector('.bell img').onclick=((ev)=>{
            if(i===1){return}
            if(ev.target.getAttribute('active')==='on'){
                sa(ev.target,'src','assets/img/bell_off.svg');
                sa(ev.target,'active','off');
                alarms[i]=false;
            }else{
                sa(ev.target,'src','assets/img/bell_on.svg');
                sa(ev.target,'active','on');
                alarms[i]=true;
            }
            storage.set({alarms:alarms});
            setupAlarms(prayer,alarms);
        });
        f.appendChild(listItem);
    }
    const todaysPrayers = gebId('today_prayers');
    todaysPrayers.innerHTML = '';
    todaysPrayers.appendChild(f);
}


function getTodaysDate(){
    const hijriFormatter = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura',
        {weekday:'long',day:'numeric',month:'numeric',year:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}
    );
    const date = hijriFormatter.formatToParts(new Date())
    return {nhar:date[0],yawm:date[2],chahr:date[4],sana:date[6],sa3a:date[10],da9i9a:date[12],tanya:date[14]}
}

function getDayInEnglish(d){
    switch (d) {
        case 'الاثنين':return 'Monday';
        case 'الثلاثاء':return 'Tuseday';
        case 'الاربعاء':return 'Wednesday';
        case 'الخميس':return 'Thursday';
        case 'الجمعة':return 'Friday';
        case 'السبت':return 'Saturday';
        case 'الأحد':return 'Sunday';
        default:return;
    }
}

document.addEventListener('DOMContentLoaded',async()=>{// عند ظهور الواجهة
    const date = getTodaysDate()
    const monthYear = `_${date.chahr.value}${date.sana.value}`;
    const monthCalendar = await storage.get({[monthYear]: null});
    const geoloc = await storage.get({"cords":null});
    const alarms = await storage.get({"alarms":null});// mochkila hna
    const langSwitch = gebId("lang-switch");
    lang = await storage.get({'lang':'ar'});
    if(lang.lang==='ar'){
        prayerNames = ['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];
    }else{
        prayerNames = ['Fajr','Shurooq','Duhr','Asr','Maghreb','Isha']
    }
    document.body.setAttribute(lang.lang,'');
    langSwitch.setAttribute(lang.lang,'');
    const todayPrayers = monthCalendar[monthYear][parseInt(date.yawm.value)-1].timings;
    setupPrayers(todayPrayers,alarms.alarms);
    setupMonthCalendar(date,monthCalendar);

    calendarSection = gebId('month_calendar_sec');// قسم الحصة الشهرية
    mainSection = gebId('main_sec');// قسم الواجهة الاساسية
    setupCurrentPrayer(todayPrayers);
    gebId('date').textContent = lang.lang==='ar'? `${date.nhar.value} ${date.yawm.value} ${getMonthName(Number(date.chahr.value))} ${date.sana.value}` : 
    `${getDayInEnglish(date.nhar.value)} ${date.yawm.value} ${getMonthName(Number(date.chahr.value))} ${date.sana.value}`;
    gebId('location').textContent=`${geoloc.cords.city}, ${geoloc.cords.country}`;
    gebId("month-calendar").onclick=()=>{// عند الضغط على زر الحصة الشهر
        mainSection.style.cssText='display:none;'
        calendarSection.style.cssText='display:block';
        document.querySelector(`ul:nth-child(${date.yawm.value})`).scrollIntoView({behavior:'smooth',block:'start'}); 
    };
   
    langSwitch.onclick=()=>{
        if(langSwitch.hasAttribute('ar')){
            document.body.removeAttribute('ar');
            langSwitch.removeAttribute('ar');
            langSwitch.setAttribute('en','');
            prayerNames = ['Fajr','Shurooq','Duhr','Asr','Maghreb','Isha'];
            lang.lang='en';
        }else{
            document.body.removeAttribute('en');
            langSwitch.removeAttribute('en');
            langSwitch.setAttribute('ar','');
            prayerNames = ['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];
            lang.lang='ar';
        }
        storage.set(lang);
        document.body.setAttribute(lang.lang,'');
        setupPrayers(todayPrayers,alarms.alarms);
        setupMonthCalendar(date,monthCalendar);
        gebId('date').textContent = lang.lang==='ar'? `${date.nhar.value} ${date.yawm.value} ${getMonthName(Number(date.chahr.value))} ${date.sana.value}` : 
        `${getDayInEnglish(date.nhar.value)} ${date.yawm.value} ${getMonthName(Number(date.chahr.value))} ${date.sana.value}`;
        setupCurrentPrayer(todayPrayers);
    };
});
