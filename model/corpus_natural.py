"""Hand-written natural sentences (not templates) for training diversity.

Run 1 memorised the template banks; these add many different ways of saying the same
thing. Format per line: text ~ mood ~ tags ~ intensity ~ risk ~ toxicity
(risk/toxicity may be blank for none). Never copied from any frozen test set;
build_dataset.py enforces that.
"""

EN = """
I honestly don't know why I keep waking up every day ~ sad ~ ~ 85 ~ possible
there's this heavy feeling that the world would be lighter without me ~ sad ~ self-doubt ~ 88 ~ possible
I've been planning what to write in my last note ~ sad ~ ~ 95 ~ high
the thought of not existing feels like relief lately ~ sad ~ ~ 88 ~ possible
I can't remember the last time I wanted to be alive ~ sad ~ ~ 88 ~ possible
sometimes I drive and think about just not turning the wheel ~ sad ~ ~ 92 ~ possible
everyone keeps saying it gets better but I'm out of patience with living ~ sad ~ ~ 85 ~ possible
I scratched my wrists till they bled again ~ sad ~ ~ 88 ~ possible
I've been reading about how many pills it takes ~ sad ~ ~ 95 ~ high
I gave my cat to my neighbour so she'll be looked after when I'm gone ~ sad ~ ~ 95 ~ high
my body is here but I've already checked out of life ~ sad ~ ~ 85 ~ possible
if I disappeared tomorrow my parents would finally stop being disappointed ~ sad ~ parental-pressure ~ 88 ~ possible
I'm exhausted from pretending I want to be here ~ sad ~ burnout ~ 85 ~ possible
I keep imagining my own funeral and it feels peaceful ~ sad ~ ~ 88 ~ possible
no future version of me exists in my head anymore ~ sad ~ ~ 85 ~ possible
I hope I don't wake up tomorrow, genuinely ~ sad ~ ~ 88 ~ possible
the only thing stopping me is my little brother ~ sad ~ family ~ 90 ~ possible
I have a plan and a date, I just needed to tell someone ~ sad ~ ~ 100 ~ high
I'm sitting on the ledge writing this ~ sad ~ ~ 100 ~ high
I've been burning my skin with a lighter to feel something ~ sad ~ ~ 88 ~ possible
life has become a waiting room and I want to leave ~ sad ~ ~ 85 ~ possible
I wish I had never been born ~ sad ~ ~ 85 ~ possible
everything would stop hurting if I just stopped ~ sad ~ ~ 88 ~ possible
I've stopped taking my meds because what's the point of staying ~ sad ~ health ~ 88 ~ possible
I'm a waste of space and air ~ sad ~ self-doubt ~ 80 ~ possible
there's no one I could call if I wanted to end things tonight ~ lonely ~ loneliness ~ 92 ~ possible
the voice in my head keeps telling me to finish it ~ sad ~ ~ 92 ~ possible
I've already said goodbye to my friends without them knowing ~ sad ~ ~ 98 ~ high
tonight I'm walking into the sea ~ sad ~ ~ 100 ~ high
my exams are killing me ~ sad ~ exam-stress ~ 35
if dad sees this report card he'll murder me lol ~ sad ~ exam-stress,parental-pressure ~ 35
I'm dead inside after this 8am lecture 😂 ~ random ~ ~ 15
this heat is literally killing me ~ random ~ ~ 10
my legs died after the trek but it was worth it ~ happy ~ small-win ~ 25
I nearly died laughing at the fest ~ happy ~ friendship ~ 20
the boss is going to skin me alive for this delay ~ career ~ work-stress ~ 40
over my dead body am I taking another night shift ~ angry ~ work-stress,venting ~ 40
I'd kill for a week of proper sleep ~ sad ~ burnout ~ 30
this group chat drama will be the death of me ~ angry ~ friendship,venting ~ 30
I'm so done with this semester, ready to sleep for a month ~ sad ~ burnout,exam-stress ~ 40
I could just die of embarrassment, I called the professor 'mom' ~ random ~ ~ 20
we've been dating for two years and I feel like we're drifting apart ~ relationship ~ ~ 55
she said she loves me but won't introduce me to her parents ~ relationship ~ family ~ 55
I finally asked him out and he said yes!! ~ relationship ~ small-win ~ 45
my boyfriend checks my phone every night and it's suffocating ~ relationship ~ anxiety ~ 60
we had our first big fight and I don't know who should apologise ~ relationship ~ overthinking,need-advice ~ 50
my ex texted happy birthday and now I can't focus ~ relationship ~ heartbreak,overthinking ~ 50
I think I'm falling for my best friend and it scares me ~ relationship ~ friendship,anxiety ~ 50
got the offer letter from my dream company today ~ happy ~ small-win,placement-stress ~ 45
my manager said I'm not 'leadership material' in my review ~ career ~ work-stress,self-doubt ~ 60
I want to switch from IT to design but I'm scared to start over ~ career ~ identity,anxiety ~ 55
the startup I joined just announced layoffs ~ career ~ work-stress,anxiety,money ~ 65
I've been unemployed for six months and the gap keeps growing ~ career ~ money,self-doubt ~ 65
I cleared the coding round but froze in the HR interview ~ career ~ placement-stress,anxiety ~ 55
my internship got extended into a full-time role! ~ happy ~ small-win ~ 45
spent the evening on the terrace with my roommates, simple and happy ~ happy ~ friendship,gratitude ~ 30
my grandmother learned to video call just to see me ~ happy ~ family,gratitude ~ 35
I fixed a bug that had me stuck for three days ~ happy ~ small-win ~ 30
my little sister passed her board exams with distinction ~ happy ~ family ~ 40
a junior thanked me for helping them settle in ~ happy ~ gratitude ~ 30
I've started journaling every night and it's helping ~ motivation ~ hope ~ 35
I'm going to apply to ten companies this week, no excuses ~ motivation ~ placement-stress ~ 40
I lied to my parents about my marks for a whole year ~ confession ~ exam-stress,parental-pressure ~ 60
I secretly dropped out of my coaching classes ~ confession ~ parental-pressure ~ 55
I've been pretending to be busy so I don't have to meet my friends ~ confession ~ friendship ~ 45
nobody at the new office talks to me during lunch ~ lonely ~ loneliness,work-stress ~ 55
I moved cities for college and I still have no one to call ~ lonely ~ loneliness,homesickness ~ 60
it's my birthday and the only wish was from my bank ~ lonely ~ loneliness ~ 50
my parents keep asking about marriage at every call ~ sad ~ parental-pressure,family ~ 50
I can't afford the trip everyone is planning ~ sad ~ money,friendship ~ 45
my dad's business failed and we might lose the house ~ sad ~ money,family,anxiety ~ 70
I keep comparing my body to influencers and hating myself ~ sad ~ body-image,comparison ~ 60
what's a good place for south indian breakfast near the office? ~ random ~ need-advice ~ 5
which online course is good for learning SQL? ~ random ~ need-advice ~ 5
the professor rescheduled the class without telling anyone, typical ~ angry ~ venting,exam-stress ~ 40
the auto driver charged me triple and laughed about it ~ angry ~ venting ~ 40
"""

HINGLISH = """
pata nahi roz subah kyu uth jata hu, koi wajah nahi bachi ~ sad ~ ~ 85 ~ possible
lagta hai duniya mere bina halki ho jayegi ~ sad ~ self-doubt ~ 88 ~ possible
aakhri chitthi me kya likhu soch raha hu ~ sad ~ ~ 95 ~ high
na hone ka khayal ab sukoon deta hai ~ sad ~ ~ 88 ~ possible
yaad nahi aakhri baar kab jeene ka mann kiya tha ~ sad ~ ~ 88 ~ possible
bike chalate waqt sochta hu bas brake na dabau ~ sad ~ ~ 92 ~ possible
sab bolte hai theek ho jayega par ab jeene ka sabar khatam ~ sad ~ ~ 85 ~ possible
haath pe phir se kaata, khoon nikal aaya ~ sad ~ ~ 88 ~ possible
padh raha tha kitni goliyon se kaam ho jayega ~ sad ~ ~ 95 ~ high
apni billi padosi ko de di taaki mere jaane ke baad koi dekh le ~ sad ~ ~ 95 ~ high
shareer yaha hai par andar se kab ka chala gaya hu ~ sad ~ ~ 85 ~ possible
main gayab ho jaun toh papa ka disappointment khatam ~ sad ~ parental-pressure ~ 88 ~ possible
yaha rehne ka natak karte karte thak gaya hu ~ sad ~ burnout ~ 85 ~ possible
apna funeral imagine karta hu aur sukoon milta hai ~ sad ~ ~ 88 ~ possible
sach me chahta hu kal subah aankh na khule ~ sad ~ ~ 88 ~ possible
bas chhote bhai ki wajah se ruka hua hu ~ sad ~ family ~ 90 ~ possible
plan bhi hai aur date bhi, bas kisi ko batana tha ~ sad ~ ~ 100 ~ high
chhat ki deewar pe baith ke likh raha hu ~ sad ~ ~ 100 ~ high
kuch mehsoos karne ke liye khud ko jala raha hu ~ sad ~ ~ 88 ~ possible
kaash paida hi na hua hota ~ sad ~ ~ 85 ~ possible
dawai lena chhod diya, rukne ka kya fayda ~ sad ~ health ~ 88 ~ possible
main hawa aur jagah dono ki barbaadi hu ~ sad ~ self-doubt ~ 80 ~ possible
dimaag me awaaz kehti rehti hai sab khatam kar de ~ sad ~ ~ 92 ~ possible
doston ko bina bataye alvida keh diya hai ~ sad ~ ~ 98 ~ high
aaj raat samundar me chala jaunga ~ sad ~ ~ 100 ~ high
exams ne meri halat kharab kar di hai ~ sad ~ exam-stress ~ 35
papa ne report card dekha toh mera murder pakka 😂 ~ sad ~ exam-stress,parental-pressure ~ 35
8 baje ki class ke baad andar se mar chuka hu 😂 ~ random ~ ~ 15
yeh garmi jaan le legi ~ random ~ ~ 10
trek ke baad pair mar gaye par maza aaya ~ happy ~ small-win ~ 25
fest me has has ke mar gaye ~ happy ~ friendship ~ 20
boss zinda nahi chhodega is delay pe ~ career ~ work-stress ~ 40
ek hafte ki neend ke liye kuch bhi kar dunga ~ sad ~ burnout ~ 30
mummy ne phone dekha toh meri khair nahi 😂 ~ sad ~ family ~ 30
sharam se mar gaya, sir ko 'mummy' bol diya ~ random ~ ~ 20
do saal se saath hai par lagta hai door ho rahe hai ~ relationship ~ ~ 55
woh kehti hai pyaar hai par ghar walon se nahi milwati ~ relationship ~ family ~ 55
aakhir propose kar diya aur usne haan bol diya!! ~ relationship ~ small-win ~ 45
boyfriend roz raat mera phone check karta hai, ghutan hoti hai ~ relationship ~ anxiety ~ 60
pehli badi ladai hui, pata nahi sorry kaun bole ~ relationship ~ overthinking,need-advice ~ 50
ex ne birthday wish kiya aur ab dimaag wahi atka hai ~ relationship ~ heartbreak,overthinking ~ 50
lagta hai best friend se pyaar ho gaya hai, darr lag raha ~ relationship ~ friendship,anxiety ~ 50
dream company ka offer letter aa gaya aaj ~ happy ~ small-win,placement-stress ~ 45
review me manager ne bola main leadership material nahi hu ~ career ~ work-stress,self-doubt ~ 60
IT chhod ke design me jaana hai par naye sire se shuru karne me darr ~ career ~ identity,anxiety ~ 55
jis startup me join kiya usne layoffs announce kar diye ~ career ~ work-stress,anxiety,money ~ 65
chhe mahine se berozgaar hu, gap badhta ja raha hai ~ career ~ money,self-doubt ~ 65
coding round nikal gaya par HR me atak gaya ~ career ~ placement-stress,anxiety ~ 55
internship full time job me badal gayi! ~ happy ~ small-win ~ 45
roommates ke saath chhat pe shaam bitayi, simple sa sukoon ~ happy ~ friendship,gratitude ~ 30
nani ne sirf mujhe dekhne ke liye video call seekha ~ happy ~ family,gratitude ~ 35
teen din se atka bug aaj fix ho gaya ~ happy ~ small-win ~ 30
roz raat diary likhna shuru kiya, help ho rahi hai ~ motivation ~ hope ~ 35
is hafte das companies me apply karunga, koi bahana nahi ~ motivation ~ placement-stress ~ 40
poore saal ghar pe marks ke baare me jhooth bola ~ confession ~ exam-stress,parental-pressure ~ 60
chupke se coaching chhod di hai ~ confession ~ parental-pressure ~ 55
naye office me lunch pe koi baat nahi karta ~ lonely ~ loneliness,work-stress ~ 55
college ke liye shehar badla aur ab tak call karne wala koi nahi ~ lonely ~ loneliness,homesickness ~ 60
birthday pe sirf bank ka wish aaya ~ lonely ~ loneliness ~ 50
har call pe shaadi ka sawaal ~ sad ~ parental-pressure,family ~ 50
sab trip plan kar rahe hai aur mere paas paise nahi ~ sad ~ money,friendship ~ 45
papa ka business doob gaya, ghar bhi ja sakta hai ~ sad ~ money,family,anxiety ~ 70
office ke paas achha dosa kaha milega? ~ random ~ need-advice ~ 5
SQL seekhne ke liye konsa course achha hai? ~ random ~ need-advice ~ 5
auto wale ne teen guna paise liye aur has raha tha ~ angry ~ venting ~ 40
"""

TENGLISH = """
roju enduku lestunnano teliyadu, karanam ledu ~ sad ~ ~ 85 ~ possible
nenu lekapothe lokam teliga untundi anipistundi ~ sad ~ self-doubt ~ 88 ~ possible
chivari letter lo emi rayalo alochistunna ~ sad ~ ~ 95 ~ high
lekunda undatam anna alochana ippudu prashantanga undi ~ sad ~ ~ 88 ~ possible
chivari sari bathakalani eppudu anipinchindo gurthu ledu ~ sad ~ ~ 88 ~ possible
bike nadipetappudu brake veyakunda unte ani anipistundi ~ sad ~ ~ 92 ~ possible
andaru antaru baguntundi ani, kani naaku opika aipoyindi ~ sad ~ ~ 85 ~ possible
chethi meeda malli koskunna, raktham vachindi ~ sad ~ ~ 88 ~ possible
enni tablets kavalo chaduvutunna ~ sad ~ ~ 95 ~ high
naa pilli ni pakkinti vallaki ichesa, nenu vellipoyaka chusukuntaru ~ sad ~ ~ 95 ~ high
body ikkada undi kani nenu eppudo vellipoyanu ~ sad ~ ~ 85 ~ possible
nenu kanipinchakapothe nanna disappointment aipotundi ~ sad ~ parental-pressure ~ 88 ~ possible
ikkada undalanukunnatlu natinchi alasipoyanu ~ sad ~ burnout ~ 85 ~ possible
naa funeral ni uhinchukunte prashantanga undi ~ sad ~ ~ 88 ~ possible
repu kallu teravakapothe bagundu ani nijam ga anipistundi ~ sad ~ ~ 88 ~ possible
thammudi kosame aagi unna ~ sad ~ family ~ 90 ~ possible
plan undi date undi, evariki aina cheppali anipinchindi ~ sad ~ ~ 100 ~ high
terrace goda meeda kurchuni idi rastunna ~ sad ~ ~ 100 ~ high
edaina feel avvadaniki nannu nenu kalchukuntunna ~ sad ~ ~ 88 ~ possible
asalu puttakapothe bagundedi ~ sad ~ ~ 85 ~ possible
mandulu vesukovadam aapesa, undi em labham ~ sad ~ health ~ 88 ~ possible
buddhi lo voice anni mugincheyi antundi ~ sad ~ ~ 92 ~ possible
friends ki teliyakunda veedkolu cheppesa ~ sad ~ ~ 98 ~ high
ivala rathri samudram loki vellipota ~ sad ~ ~ 100 ~ high
exams naa paristhiti chedagottayi ~ sad ~ exam-stress ~ 35
nanna report card chusthe naa pani aipoyinatte 😂 ~ sad ~ exam-stress,parental-pressure ~ 35
8 gantala class tarvatha lopala chachipoyanu 😂 ~ random ~ ~ 15
ee endalu pranam teestunnayi ~ random ~ ~ 10
trek tarvatha kaallu poyayi kani super ga undi ~ happy ~ small-win ~ 25
fest lo navvi navvi chachipoyam ~ happy ~ friendship ~ 20
ee delay ki boss nannu vadaladu ~ career ~ work-stress ~ 40
amma phone chusthe naa pani ayipoyinatte 😂 ~ sad ~ family ~ 30
siggu tho chachipoyanu, sir ni amma annanu ~ random ~ ~ 20
rendu samvatsaralu ga kalisi unnam kani dooram avtunnam ~ relationship ~ ~ 55
aame love chestanu antundi kani intlo vallaki parichayam cheyadu ~ relationship ~ family ~ 55
chivariki propose chesa, aame yes chepindi!! ~ relationship ~ small-win ~ 45
boyfriend roju rathri naa phone check chestadu, oopiri aadatledu ~ relationship ~ anxiety ~ 60
first pedda godava ayyindi, evaru sorry cheppalo teliyadu ~ relationship ~ overthinking,need-advice ~ 50
ex birthday wish chesindi, ippudu focus ledu ~ relationship ~ heartbreak,overthinking ~ 50
best friend tho prema lo paddanu emo, bhayam ga undi ~ relationship ~ friendship,anxiety ~ 50
dream company nundi offer letter vachindi ivala ~ happy ~ small-win,placement-stress ~ 45
review lo manager nenu leadership material kadu annadu ~ career ~ work-stress,self-doubt ~ 60
IT vadili design ki vellali kani malli start cheyadaniki bhayam ~ career ~ identity,anxiety ~ 55
join ayina startup layoffs announce chesindi ~ career ~ work-stress,anxiety,money ~ 65
aaru nelalu ga job ledu, gap perugutundi ~ career ~ money,self-doubt ~ 65
coding round clear chesa kani HR lo freeze ayya ~ career ~ placement-stress,anxiety ~ 55
internship full time job ayyindi! ~ happy ~ small-win ~ 45
roommates tho terrace meeda saayantram, simple happiness ~ happy ~ friendship,gratitude ~ 30
ammamma nannu chudadaniki video call nerchukundi ~ happy ~ family,gratitude ~ 35
moodu rojula bug ivala fix chesa ~ happy ~ small-win ~ 30
roju rathri diary rayadam start chesa, help avtundi ~ motivation ~ hope ~ 35
ee vaaram padi companies ki apply chesta, excuses levu ~ motivation ~ placement-stress ~ 40
samvatsaram antha intlo marks gurinchi abaddham chepa ~ confession ~ exam-stress,parental-pressure ~ 60
evariki teliyakunda coaching maanesa ~ confession ~ parental-pressure ~ 55
kotha office lo lunch lo evaru matladaru ~ lonely ~ loneliness,work-stress ~ 55
college kosam city marchanu, inka call cheyadaniki evaru leru ~ lonely ~ loneliness,homesickness ~ 60
birthday ki bank matrame wish chesindi ~ lonely ~ loneliness ~ 50
prathi call lo pelli prashna ~ sad ~ parental-pressure,family ~ 50
andaru trip plan chestunnaru, naa daggara dabbulu levu ~ sad ~ money,friendship ~ 45
nanna business poyindi, illu kuda pothundemo ~ sad ~ money,family,anxiety ~ 70
office daggara manchi dosa ekkada? ~ random ~ need-advice ~ 5
auto vadu moodu retlu teesukuni navvadu ~ angry ~ venting ~ 40
"""

TELUGU = """
రోజూ ఎందుకు లేస్తున్నానో తెలియదు, కారణం లేదు ~ sad ~ ~ 85 ~ possible
నేను లేకపోతే లోకం తేలికగా ఉంటుంది అనిపిస్తోంది ~ sad ~ self-doubt ~ 88 ~ possible
చివరి ఉత్తరంలో ఏం రాయాలో ఆలోచిస్తున్నా ~ sad ~ ~ 95 ~ high
లేకుండా ఉండటం అనే ఆలోచన ఇప్పుడు ప్రశాంతంగా ఉంది ~ sad ~ ~ 88 ~ possible
చేతి మీద మళ్ళీ కోసుకున్నా, రక్తం వచ్చింది ~ sad ~ ~ 88 ~ possible
ఎన్ని మాత్రలు కావాలో చదువుతున్నా ~ sad ~ ~ 95 ~ high
శరీరం ఇక్కడ ఉంది కానీ నేను ఎప్పుడో వెళ్ళిపోయా ~ sad ~ ~ 85 ~ possible
రేపు కళ్ళు తెరవకపోతే బాగుండు ~ sad ~ ~ 88 ~ possible
తమ్ముడి కోసమే ఆగి ఉన్నా ~ sad ~ family ~ 90 ~ possible
ప్లాన్ ఉంది, తేదీ ఉంది, ఎవరికైనా చెప్పాలనిపించింది ~ sad ~ ~ 100 ~ high
అసలు పుట్టకపోతే బాగుండేది ~ sad ~ ~ 85 ~ possible
మందులు వేసుకోవడం ఆపేశా, ఉండి ఏం లాభం ~ sad ~ health ~ 88 ~ possible
ఫ్రెండ్స్ కి తెలియకుండా వీడ్కోలు చెప్పేశా ~ sad ~ ~ 98 ~ high
పరీక్షలు నా పరిస్థితి చెడగొట్టాయి ~ sad ~ exam-stress ~ 35
ఈ ఎండలు ప్రాణం తీస్తున్నాయి ~ random ~ ~ 10
ఫెస్ట్ లో నవ్వి నవ్వి చచ్చిపోయాం ~ happy ~ friendship ~ 20
ఈ ఆలస్యానికి బాస్ నన్ను వదలడు ~ career ~ work-stress ~ 40
రెండేళ్ళుగా కలిసి ఉన్నాం కానీ దూరం అవుతున్నాం ~ relationship ~ ~ 55
చివరికి ప్రపోజ్ చేశా, ఆమె ఒప్పుకుంది!! ~ relationship ~ small-win ~ 45
మొదటి పెద్ద గొడవ అయింది, ఎవరు సారీ చెప్పాలో తెలియదు ~ relationship ~ overthinking,need-advice ~ 50
డ్రీమ్ కంపెనీ నుంచి ఆఫర్ లెటర్ వచ్చింది ~ happy ~ small-win,placement-stress ~ 45
రివ్యూలో మేనేజర్ నేను లీడర్‌షిప్ కి పనికిరాను అన్నాడు ~ career ~ work-stress,self-doubt ~ 60
ఆరు నెలలుగా ఉద్యోగం లేదు ~ career ~ money,self-doubt ~ 65
మూడు రోజుల బగ్ ఈ రోజు ఫిక్స్ చేశా ~ happy ~ small-win ~ 30
అమ్మమ్మ నన్ను చూడటానికి వీడియో కాల్ నేర్చుకుంది ~ happy ~ family,gratitude ~ 35
రోజూ రాత్రి డైరీ రాయడం మొదలుపెట్టా, సహాయం చేస్తోంది ~ motivation ~ hope ~ 35
ఏడాది పాటు ఇంట్లో మార్కుల గురించి అబద్ధం చెప్పా ~ confession ~ exam-stress,parental-pressure ~ 60
కొత్త ఆఫీసులో లంచ్ లో ఎవరూ మాట్లాడరు ~ lonely ~ loneliness,work-stress ~ 55
పుట్టినరోజుకి బ్యాంక్ మాత్రమే విష్ చేసింది ~ lonely ~ loneliness ~ 50
నాన్న వ్యాపారం పోయింది, ఇల్లు కూడా పోతుందేమో ~ sad ~ money,family,anxiety ~ 70
ఆఫీసు దగ్గర మంచి దోశ ఎక్కడ? ~ random ~ need-advice ~ 5
"""

DEVANAGARI = """
पता नहीं रोज़ सुबह क्यों उठ जाता हूं, कोई वजह नहीं बची ~ sad ~ ~ 85 ~ possible
लगता है दुनिया मेरे बिना हल्की हो जाएगी ~ sad ~ self-doubt ~ 88 ~ possible
आखिरी चिट्ठी में क्या लिखूं सोच रहा हूं ~ sad ~ ~ 95 ~ high
ना होने का ख्याल अब सुकून देता है ~ sad ~ ~ 88 ~ possible
हाथ पर फिर से काटा, खून निकल आया ~ sad ~ ~ 88 ~ possible
पढ़ रहा था कितनी गोलियों से काम हो जाएगा ~ sad ~ ~ 95 ~ high
शरीर यहां है पर अंदर से कब का चला गया हूं ~ sad ~ ~ 85 ~ possible
सच में चाहता हूं कल सुबह आंख ना खुले ~ sad ~ ~ 88 ~ possible
बस छोटे भाई की वजह से रुका हुआ हूं ~ sad ~ family ~ 90 ~ possible
प्लान भी है और तारीख भी, बस किसी को बताना था ~ sad ~ ~ 100 ~ high
काश पैदा ही ना हुआ होता ~ sad ~ ~ 85 ~ possible
दवाई लेना छोड़ दिया, रुकने का क्या फायदा ~ sad ~ health ~ 88 ~ possible
दोस्तों को बिना बताए अलविदा कह दिया है ~ sad ~ ~ 98 ~ high
परीक्षाओं ने मेरी हालत खराब कर दी है ~ sad ~ exam-stress ~ 35
ये गर्मी जान ले लेगी ~ random ~ ~ 10
फेस्ट में हंस हंस के मर गए ~ happy ~ friendship ~ 20
इस देरी पर बॉस ज़िंदा नहीं छोड़ेगा ~ career ~ work-stress ~ 40
दो साल से साथ हैं पर लगता है दूर हो रहे हैं ~ relationship ~ ~ 55
आखिर प्रपोज़ कर दिया और उसने हां बोल दी!! ~ relationship ~ small-win ~ 45
पहली बड़ी लड़ाई हुई, पता नहीं सॉरी कौन बोले ~ relationship ~ overthinking,need-advice ~ 50
ड्रीम कंपनी का ऑफर लेटर आ गया आज ~ happy ~ small-win,placement-stress ~ 45
रिव्यू में मैनेजर ने कहा मैं लीडरशिप लायक नहीं हूं ~ career ~ work-stress,self-doubt ~ 60
छह महीने से बेरोज़गार हूं ~ career ~ money,self-doubt ~ 65
तीन दिन से अटका बग आज ठीक हो गया ~ happy ~ small-win ~ 30
नानी ने सिर्फ मुझे देखने के लिए वीडियो कॉल सीखा ~ happy ~ family,gratitude ~ 35
रोज़ रात डायरी लिखना शुरू किया, मदद हो रही है ~ motivation ~ hope ~ 35
पूरे साल घर पर मार्क्स के बारे में झूठ बोला ~ confession ~ exam-stress,parental-pressure ~ 60
नए ऑफिस में लंच पर कोई बात नहीं करता ~ lonely ~ loneliness,work-stress ~ 55
जन्मदिन पर सिर्फ बैंक ने विश किया ~ lonely ~ loneliness ~ 50
पापा का बिज़नेस डूब गया, घर भी जा सकता है ~ sad ~ money,family,anxiety ~ 70
ऑफिस के पास अच्छा डोसा कहां मिलेगा? ~ random ~ need-advice ~ 5
"""

BLOCKS = {"en": EN, "hinglish": HINGLISH, "tenglish": TENGLISH, "telugu": TELUGU, "devanagari": DEVANAGARI}


def natural_rows() -> list[dict]:
    rows = []
    for lang, block in BLOCKS.items():
        for line in block.strip().splitlines():
            parts = [p.strip() for p in line.split("~")]
            text, mood, tags, intensity = parts[0], parts[1], parts[2], int(parts[3])
            risk = parts[4] if len(parts) > 4 and parts[4] else "none"
            tox = parts[5] if len(parts) > 5 and parts[5] else "none"
            rows.append({"text": text, "mood": mood, "tags": [t for t in tags.split(",") if t],
                         "intensity": intensity, "risk": risk, "toxicity": tox, "lang": lang,
                         "source": "syn:natural"})
    return rows
