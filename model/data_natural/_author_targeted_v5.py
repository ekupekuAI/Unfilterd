"""Targeted natural posts for run 5, written from the ERROR CATEGORIES seen on the dev
sets (never copying dev or holdout sentences): Hinglish/Hindi ideation phrasing,
indirect safety disclosures, parents-are-angry idioms, tired-and-sleepy posts, and
everyday frustration hyperbole. Run: python _author_targeted_v5.py"""
import json
from pathlib import Path

L = {"en": "en", "hi": "hinglish", "tg": "tenglish", "te": "telugu", "dv": "devanagari"}
rows = []


def add(kind, lang, mood, tags, intensity, risk, texts):
    for t in texts.strip().splitlines():
        t = t.strip()
        if t:
            rows.append({"text": t, "mood": mood, "tags": [x for x in tags.split(",") if x], "intensity": intensity,
                         "risk": risk, "toxicity": "none", "lang": L[lang], "kind": kind})


# ---- A. ideation phrasing (possible) ----
add("crisis", "hi", "sad", "", 88, "possible", """
roz raat marne ka khayal aata hai
din bhar bas yahi sochta rehta hu ki main na rahu toh
har subah uthke lagta hai kaash uthta hi nahi
mann karta hai sab kuch hamesha ke liye khatam ho jaye
ab bas khatam hona hai, aur kuch nahi chahiye
marne ke khayal se hi sukoon milta hai aajkal
kabhi kabhi lagta hai bas so jaun aur kabhi na uthu
jeena ek bojh lagne laga hai yaar
sochti rehti hu ki mere jaane ke baad sab kaisa hoga
har roz thoda thoda marta ja raha hu andar se, ab poora khatam karna hai
dimaag me bas ek hi baat ghoomti hai, ki sab chhod du hamesha ke liye
mujhe zinda rehne ka koi matlab samajh nahi aata ab
ek baar sab ruk jaye bas, hamesha ke liye, yahi chahta hu
lagta hai mere bina ghar wale zyada khush rahenge, chala jaana chahiye
neend ki goliyon ke baare me sochne laga hu
kabhi kabhi train ke saamne khade hone ka khayal aata hai
aaj phir se wahi khayal, ki sab khatam kar du
mujhe nahi lagta main zyada din aur jhel paunga
bas thak gaya hu zinda rehne se
ab kisi cheez ke liye jeena nahi hai
mere hone na hone se kya farak padta hai, sach me khatam ho jaun toh achha
roz raat rote rote sochti hu ki subah na ho
""")
add("crisis", "dv", "sad", "", 88, "possible", """
रोज़ रात मरने का ख्याल आता है
दिन भर बस यही सोचता रहता हूं कि मैं ना रहूं तो
मन करता है सब कुछ हमेशा के लिए खत्म हो जाए
अब बस खत्म होना है, और कुछ नहीं चाहिए
मरने के ख्याल से ही सुकून मिलता है आजकल
जीना एक बोझ लगने लगा है
सोचती रहती हूं कि मेरे जाने के बाद सब कैसा होगा
मुझे ज़िंदा रहने का कोई मतलब समझ नहीं आता
एक बार सब रुक जाए बस, हमेशा के लिए
लगता है मेरे बिना घर वाले ज़्यादा खुश रहेंगे
नींद की गोलियों के बारे में सोचने लगा हूं
बस थक गया हूं ज़िंदा रहने से
रोज़ रात रोते रोते सोचती हूं कि सुबह ना हो
""")
add("crisis", "tg", "sad", "", 88, "possible", """
roju rathri chanipovali anna alochana vastundi
nenu lekapothe ela untundo ani roju alochistunna
anni okkasari aipothe bagundu ani anipistundi
bathakadam oka baruvu la undi
nidra mathralu gurinchi alochistunna ee madhya
nenu lekapothe intlo vallu happy ga untaru, vellipovali
inka ekkuva rojulu bharinchalenu anipistundi
bathiki undadam tho alasipoyanu
""")
add("crisis", "te", "sad", "", 88, "possible", """
రోజూ రాత్రి చావు గురించి ఆలోచనలు వస్తున్నాయి
నేను లేకపోతే ఎలా ఉంటుందో రోజూ ఆలోచిస్తున్నా
అన్నీ ఒక్కసారి ముగిసిపోతే బాగుండు
బతకడం ఒక భారంలా ఉంది
నిద్ర మాత్రల గురించి ఆలోచిస్తున్నా ఈ మధ్య
బతికి ఉండటంతో అలసిపోయా
""")
add("crisis", "en", "sad", "", 88, "possible", """
I told the counsellor I'm fine but I've been planning how not to be here
my doctor asked about dark thoughts and I just smiled and said no
I hide the cuts so well nobody at home has noticed
when my friend asked if I'd ever hurt myself I laughed it off, but I have
I keep saying I'm okay because the truth would scare everyone
I've been googling things I shouldn't be googling at 3am
I said 'no' on the mental health form even though the answer is yes
my mom thinks I'm just tired, she doesn't know I don't want to wake up
I deleted my search history again so no one finds what I was reading
I keep thinking about dying, every single day, quietly
the thought of not being alive follows me everywhere lately
I wish it would all just stop, permanently
""")

# ---- B. safe idioms and ordinary tiredness/frustration (none) ----
add("safe_idiom", "hi", "sad", "exam-stress,parental-pressure", 35, "none", """
papa ne result dekha toh ghar se nikaal denge 😂
mummy ko pata chala toh zinda nahi chhodengi, pakka
ghar pe pata chala bunk kiya toh meri khair nahi
report card dikhaya toh papa kachcha chaba jayenge 😂
marks dekh ke mummy chappal se swagat karegi
bhai agar dadi ko pata chala toh mera band baj jayega
ghar wale zinda nahi chhodenge agar unhe pata chala ki maine tattoo banwaya
mummy dekh legi toh aaj meri shamat hai 😂
""")
add("safe_idiom", "dv", "sad", "exam-stress,parental-pressure", 35, "none", """
पापा ने रिज़ल्ट देखा तो घर से निकाल देंगे 😂
मम्मी को पता चला तो ज़िंदा नहीं छोड़ेंगी, पक्का
घर पर पता चला कि बंक किया तो मेरी खैर नहीं
मार्क्स देखकर मम्मी चप्पल से स्वागत करेंगी 😂
घर वाले ज़िंदा नहीं छोड़ेंगे अगर उन्हें पता चला कि मैंने टैटू बनवाया
आज मम्मी देख लेंगी तो मेरी शामत है 😂
""")
add("safe_idiom", "tg", "sad", "exam-stress,parental-pressure", 35, "none", """
nanna result chusthe intlo nundi bayataki tosestaru 😂
amma ki telisthe nannu champestundi pakka
bunk kotti dorikithe intlo naa paristhiti ayipoyinatte
marks chusi amma cheppu tho swagatam chestundi 😂
""")
add("safe_idiom", "te", "sad", "exam-stress,parental-pressure", 35, "none", """
నాన్న రిజల్ట్ చూస్తే ఇంట్లోంచి బయటకి తోసేస్తారు 😂
అమ్మకి తెలిస్తే నన్ను చంపేస్తుంది పక్కా
మార్కులు చూసి అమ్మ చెప్పుతో స్వాగతం చేస్తుంది 😂
""")
add("safe_idiom", "en", "sad", "exam-stress,parental-pressure", 30, "none", """
if my parents find out I bunked, I'm grounded till I'm thirty
dad's going to have my head when he sees this bill 😂
mom will skin me alive if she finds the tattoo
my parents are going to disown me over this haircut lol
""")
add("everyday", "hi", "sad", "burnout", 35, "none", """
bohot thak gaya hu aaj, bas so jaana hai
pura din kaam, ab sirf bistar chahiye
neend poori nahi hui, aankhein band ho rahi hai
aaj kuch nahi karna, bas aaram
thakaan itni hai ki khana bhi skip kar ke sona hai
""")
add("everyday", "dv", "sad", "burnout", 35, "none", """
आज बहुत थक गई हूं, बस सो जाना है
पूरा दिन काम, अब सिर्फ बिस्तर चाहिए
नींद पूरी नहीं हुई, आंखें बंद हो रही हैं
आज कुछ नहीं करना, बस आराम
""")
add("everyday", "tg", "sad", "burnout", 35, "none", """
ivala chala alasipoyanu, nidrapovali anthe
roju antha pani, ippudu bed matrame kavali
nidra saripoledu, kallu moosukupotunnayi
""")
add("everyday", "te", "sad", "burnout", 35, "none", """
ఈ రోజు చాలా అలసిపోయా, నిద్రపోవాలి అంతే
రోజంతా పని, ఇప్పుడు బెడ్ మాత్రమే కావాలి
నిద్ర సరిపోలేదు, కళ్ళు మూసుకుపోతున్నాయి
""")
add("everyday", "en", "sad", "burnout", 30, "none", """
so tired today, just going to crash early
long day, all I want is my bed and silence
didn't sleep last night, eyes are literally closing
taking a nap and pretending today didn't happen
""")
add("safe_idiom", "en", "angry", "venting", 40, "none", """
this wifi makes me want to throw my router off the balcony
ready to chuck my phone into the lake after that call
I swear I'm going to bang my head on this desk if the build fails again
about to yeet my laptop across the room, this code hates me
""")
add("safe_idiom", "hi", "angry", "venting", 40, "none", """
is wifi ko khidki se bahar phek du kya
yeh code dekh ke laptop tod dene ka mann kar raha hai
""")
add("everyday", "en", "relationship", "heartbreak", 45, "none", """
miss him a lot tonight, but walking away was the right thing
thinking about my ex again, though I know we're better apart
some nights I still miss her, but I don't regret the breakup
""")
add("everyday", "hi", "sad", "comparison", 30, "none", """
cousin phir se first aaya, ab family function me mera kya hoga 😂
padosi ka beta US chala gaya, ab mummy roz sunayegi 😂
""")

if __name__ == "__main__":
    out = Path(__file__).with_name("targeted_v5.jsonl")
    with out.open("w", encoding="utf-8", newline="\n") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(len(rows), "rows ->", out.name)
