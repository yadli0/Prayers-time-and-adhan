let mainSection,calendarSection;

// اختصار لتقليص حجم البرنامج
function sa(e,a,v){e.setAttribute(a,v)}
function gebId(id){return document.getElementById(id)}

function getMonthName(n){return ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى اﻷولى','جمادة الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'][n-1];}

const storage = chrome.storage.local;

function getCurrentTimeInMinutes() {
    const date= new Date();
    return [date.getHours()*60+date.getMinutes(),date.getSeconds()];
}

const prayerIcons=['fajr','du7a_maghrib','duhr_3asr','duhr_3asr','du7a_maghrib','3icha'];
const prayerNames=['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];

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
        setInterval(() => {
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
        setInterval(() => {
            s++;
            if(s===60){
                s=0;m++;
                if(m===20){clearInterval(this)}
            }
            if(s<10){displaySeconds=`0${s}`}else{displaySeconds=s}
            if(m<10){displyMinutes=`0${m}`}else{displyMinutes=m}
            countDownElement.textContent=`00:${displyMinutes}:${displaySeconds}`;
        }, 1000);
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
                gebId('details').textContent = 'مر على الاذان';
            }else{
                gebId('details').textContent = 'بقي على الاذان';
            }
            currentPrayer = prayerNames[i];
            gebId('nextPrayerName').textContent=prayerNames[i];
            sa(gebId('prayer_icon'),'src',`assets/img/${prayerIcons[i]}.svg`)
            sa(gebId(prayerNames[i]),'current','');
            stupCountDown(currentTimeInMinutes[0],prayerMinutes,currentTimeInMinutes[1]);
            break
        }
    }
    if(currentPrayer===null){
        gebId('nextPrayerName').textContent=prayerNames[0];
        sa(gebId('prayer_icon'),'src',`assets/img/${prayerIcons[0]}.svg`)
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
        f.appendChild(listItem)
    }
    gebId('prayers').appendChild(f)
}


function getTodaysDate(){
    const hijriFormatter = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura',
        {weekday:'long',day:'numeric',month:'numeric',year:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}
    );
    const date = hijriFormatter.formatToParts(new Date())
    return {nhar:date[0],yawm:date[2],chahr:date[4],sana:date[6],sa3a:date[10],da9i9a:date[12],tanya:date[14]}
}


document.addEventListener('DOMContentLoaded',async()=>{// عند ظهور الواجهة
    const date = getTodaysDate()
    const monthYear = `_${date.chahr.value}${date.sana.value}`;
    const lomia = await storage.get({[monthYear]: null});
    const geoloc = await storage.get({"cords":null});
    const alarms = await storage.get({"alarms":null});// mochkila hna
    const todayPrayers = lomia[monthYear][parseInt(date.yawm.value)-1].timings;
    setupPrayers(todayPrayers,alarms.alarms);
    setupMonthCalendar(date,lomia)

    calendarSection = gebId('month_calendar_sec');// قسم الحصة الشهرية
    mainSection = gebId('main_sec');// قسم الواجهة الاساسية
    setupCurrentPrayer(todayPrayers);
    gebId('date').textContent = `${date.nhar.value} ${date.yawm.value} ${getMonthName(Number(date.chahr.value))} ${date.sana.value}`;
    gebId('location').textContent=`${geoloc.cords.city}, ${geoloc.cords.country}`;
    gebId("month-calendar").onclick=()=>{// عند الضغط على زر الحصة الشهر
        mainSection.style.cssText='display:none;'
        calendarSection.style.cssText='display:block';
        document.querySelector(`ul:nth-child(${date.yawm.value})`).scrollIntoView({behavior:'smooth',block:'start'}); 
    };
});
