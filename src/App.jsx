import React, { useState, useEffect, useCallback } from "react";
import { Lock, User, Check, X, ShieldCheck, Upload, Users, BarChart3, LogOut, Vote, Plus, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { storageGet, storageSet } from "./storage.js";

// ---------- Constants ----------
const ADMIN_PASSWORD = "Wickedsmile"; // change this before sharing the real link
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB upload cap for candidate photos
const SESSION_KEY = "nacos_session_v1";
const IDLE_LIMIT_MS = 5 * 60 * 1000; // auto-logout after 5 minutes of inactivity

function loadSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function saveSession(session) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {}
}
function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

// Names pulled from the department's ND1 (25-series) and ND2 (24-series) class lists.
// Blank string = no name on record yet for that matric number.
const ND24_NAMES = {
  1: "", 2: "ABDUL RASAQ A.", 3: "ADEFEMI PRECIOUS M.", 4: "ADERINOYE PRECIOUS D.",
  5: "ADESHINA BOLUWATIFE S", 6: "AFOLABI DAVID A.", 7: "ALADE SARAH O.", 8: "ALADESIUN MARVELOUS T.",
  9: "AREDUNMOLA ONAARA T.", 10: "BAMGBOYE OMOLOLA A.", 11: "IGE AYOMIDE VICTOR", 12: "JONAH DOLAPO S.",
  13: "OLADUNJOYE ADEDAYO J.", 14: "OLAWOYIN TEMILOPE PAUL", 15: "OMOWAYE VICTOR OLAOLUWA",
  16: "SIMON ENOCH ONYEDIKACHI", 17: "TAJUDEEN JAMIU OLUMIDE", 18: "ADEBAYO ELIJAH OLUWAFUNBI",
  19: "ADEPETUN AYOMIDE DANIEL", 20: "AFELUMO OLUWAPELUMI P", 21: "AYODELE TIMILEHIN ISAAC",
  22: "IGE ADENIYI EBENEZER", 23: "OLUSOLA AYOMIDE TIMOTHY", 24: "ARIYO MOLOLUWA DAMILOLA",
  25: "FASAGBA AYOMIPOSI KOLE", 26: "IDRIS YARU NASIRUDEEN", 27: "RAJI TOHEEB ADEWALE",
  28: "AUGUSTINE JAMES IGBOKE", 29: "ADEBAYO MARY ADEOLA", 30: "FALOYE DAVID O.",
  31: "BABALOLA FERANMI D.", 32: "BAMIDELE PRECIOUS O.", 33: "OLUWASAYO OKIKIOGO L",
  34: "OWOEYE AYOBAMI ISAAC", 35: "AIWUYO GIFT ESOSA", 36: "BUHARI GBOLAHAN SODIQ",
  37: "SIKIRU HAMEED DAMILARE", 38: "MATTHEW SAMUEL ADINOHI", 39: "OMOLAFE KEHINDE NAOMI",
  40: "SULAIMAN USMAN ABIODUN", 41: "BAMBE SAMUEL BLESSING", 42: "FAYOWOLE FERANMI JULIUS",
  43: "JOSEPH VICTORY IRETEH", 44: "BAMISAYE BRIGHT OLAMILEKAN", 45: "MICHAEL GODWILL UCHENA",
  46: "OMOYAJOWO ABIGEAL ENIOLA", 47: "ABERE IYANUOLUWA E", 48: "ADELUSI LATEEF AYODEJI",
  49: "ONIGBINDE TOSIN AKIN", 50: "PAUL MARY BOLANLE", 51: "YUSUF MUKAILA GBENGA",
  52: "CHUKWU COLLINS SAVIOUR", 53: "FAPETU SAMUEL AYORINDE", 54: "OLOYEDE AZEEZ ISAAC",
  55: "OSUNLA TEMITOPE M", 56: "UMARU FARUQ AMOTO", 57: "ABDULQUADRI HALIMAT O",
  58: "AJIGBOLAMU OLALEKAN E", 59: "", 60: "OLUWATOSIN DIVINE SAMUEL", 61: "IDRIS RAHIMAT OYEEZA",
  62: "JOSEPH JACOB FRIDAY", 63: "OLATUNDE NELSON OYINLOLA", 64: "SODEINDE GRACE O",
  65: "ASAOLU TIMILEYIN MICHEAL", 66: "EGEJURU EMMANUEL MAYOWA", 67: "IBITOYE BOLUWATIFE OPEYEMI",
  68: "OLATUNJI OLUWAKEMISOLA GOODNESS", 69: "OLORUNFEMI PRECIOUS O", 70: "ADU JIBOLA JAMES",
  71: "AINA A. IYANUOLUWA", 72: "INALEGWU DANIEL ADOKA", 73: "OLORUNMOLA EMMANUEL P",
  74: "USMAN NURUDEEN O.", 75: "ADELEYE ABIODUN E.", 76: "OGUNSAKIN OLUWASEGUN M",
  77: "VANDE DANIEL Z", 78: "OLATEJU SOLOMON O", 79: "OLASUNKANMI IBRAHIM G", 80: "OYEDOTUN OKIKI OLAMIDE",
  81: "ADEBAYO ADENIYI ISREAL", 82: "OJO OLUWASEYIFUNMI O", 83: "OLAYINKA OLASUNKANMI S",
  84: "UKUVA ANDREW SAVIOUR", 85: "AYODEJI DAVID OLAMIDE",
};
const ND25_NAMES = {
  1: "ADEDAYO EMMANUEL IYANU", 2: "AJAGUN OPEYEMI MATTHEW", 3: "ABIMBOLA AYOMIDE TEMILOLUWA",
  4: "ABIODUN MICHAEL TOMIWA", 5: "ABIWO OBATERUN", 6: "ADEBAYO DANIEL AYOMILEKAN",
  7: "ADEBILAYO HENRY AYOBAMI", 8: "ADEBOYE PEACE ADEBOLANLE", 9: "ADEDARA AYOMIPOSI OLUWASEFUNMI",
  10: "ADEGBUYIRO IYANUOLUWA ADERONKE", 11: "ADEJUMO ADEDAYO EMMANUEL", 12: "ADEOLA SAMUEL OLORUNLEYE",
  13: "ADEOYE ADEDEJI OLUWADUNNSIN", 14: "ADERINTO ISAAC OLAMILEKAN", 15: "ADETUNJI AKEEM ABDULLAHI",
  16: "ADEYEYE AYOMIDE SAMUEL", 17: "ADEYEYE TOLULOPE OLALEKAN", 18: "ADEYINKA OMOPARIOLA OLUWAGBENGA",
  19: "AFOLAYAN TAIWO VICTOR", 20: "AJAYI DANIEL IFEOLUWA", 21: "AJAYI OLAMILEKAN DANIEL",
  22: "AJAYI OLANREWAJU ADURAGBEMI", 23: "AJAYI VICTOR OLAMIDE", 24: "AJIBOYE DANIEL DAMILARE",
  25: "AJILEYE OLAOLUWA SUNDAY", 26: "AKINBOBOLA VICTOR KAYODE", 27: "AKINFEMIWA OLORUNWA",
  28: "AKINOLA AYOMIDE SAMUEL", 29: "AKINOLA OREOLUWA JANET", 30: "AKINYEMI SUNDAY OLUWATOBILOBA",
  31: "AKOLADE VICTOR IFEOLUWA", 32: "AKUKARIA UGOCHI FAVOUR", 33: "ANUSHEM ENOCH CHUKWUDUMEBI",
  34: "ARILEWOLA MAYOWA EZEKIEL", 35: "ARIYO JAMIU DAMILOLA", 36: "AROGE OLUWASEUN TOSIN",
  37: "ATOBAJE EMMANUEL ADEKUNLE", 38: "AYANKOYA VICTOR AYOMIPOSI", 39: "AYENI SUNDAY OLUWABUKUNMI",
  40: "AYENI TAIWO OLAJUMO", 41: "AYODELE OLUWADUNSIN AYOOLA", 42: "BABARIINDE JOHN", 43: "",
  44: "BOWOFOLA MARVELLOUS ANJOLAOLUWA", 45: "BOYEDE SUNDAY OLUWAFERANMI", 46: "DAVID SUNDAY MIRACLE",
  47: "ELISHA ADURAGBEMI COMFORT", 48: "AGBOOLA EMMANUEL MOJOLAJESU", 49: "FAKINLEDE VICTORIA OLAMIDE",
  50: "FALOLA WURAOLA FAVOUR", 51: "FALOYO OLUWASEYI EMMANUEL", 52: "FASEHUN ELIJAH OLUWADAMILARE",
  53: "FEBISOLA TOBI SUNDAY", 54: "IBITOYE BLESSING JOHN", 55: "IBRAHIM MUHAMMAD AYOMIDE",
  56: "IBRAHIMOH DESTINY COLLINS", 57: "JOSHUA RICHARD SUNDAY", 58: "KAREEM VICTOR ADINOYI",
  59: "KAYODE OLUWATOBA RAPHAEL", 60: "KAZEEM TIMILEHIN ABDULRAHSHAD", 61: "LAWAL RUTH IRETIOLUWA",
  62: "LUCKY PROMISE SEUN", 63: "ODIYEYE STEPHEN", 64: "OGUNDIRAN DAMILARE EZEKIEL",
  65: "OGUNSEYIMI OLATOMIDE", 66: "OJO SAMUEL OPEYEMI", 67: "OKORIE CHINAGOROM ISAAC",
  68: "OKUNTADE OLUWAFEMI SMART", 69: "OLADELE OLUWATOYIN OWOLUWA", 70: "OLADITI TOYOSI SPENCER",
  71: "OLAIYA OMOTAYO OLUWAPELUMI", 72: "OLANIYI ABIOLA OLAMIDE", 73: "OLAREWAJU OLAYEMI SAMUEL",
  74: "OLATIMILEHIN AYODEJI VICTOR", 75: "OLATUNDE ILERI OLUWA", 76: "OLOGBESE ADEBORIOTA DAVID",
  77: "OLORUNFEMI ADEDAYO EZEKIEL", 78: "OLORUNLANA MICHAEL TREASURE", 79: "OLUWADAMILARE BOLUWATIFE BEST",
  80: "OLUWAFEMI JOSHUA OLUWAGBENGA", 81: "OLUWAGBEMI SAMSON TOSIN", 82: "OLUWAGUNWA FAVOUR DEMILADE",
  83: "OMIDIJI OJO SAMSON", 84: "OMOLEWA OLUMIDE EMMANUEL", 85: "OMOTAYO SAMUEL TOLULOPE",
  86: "OMOYAJOWO AYOMIDE IYANU", 87: "OMOYENI OLUWAMAYOWA JOSHUA", 88: "OSHODI BRIGHT AYOMIDE",
  89: "OWOEYE OLUWANIFEMI AYOMIDE", 90: "OWOLABI ADEOLU FERANMI", 91: "OWOSENI SEGUN OLUWASEUN",
  92: "OYELEKE INIOLUWA ELIJAH", 93: "SAMUEL OLAMILEKAN DANIEL", 94: "SUNDAY MATTHEW BABATUNDE",
  95: "TAIWO SEGUN ISRAEL", 96: "UMUKORO PAUL OLAMILEKAN", 97: "UTHMAN SHAKIROH AJOKE",
  98: "YISA OLUWASEUN TEMITOPE", 99: "YUNISA JUMAI OYISA", 100: "ADENIYI FATIMAH BUSAYO",
  101: "ADERIBIGBE JOSEPH BOLARINWA", 102: "AKINLABI SAMUEL MAYOWA", 103: "BELLO MERCY ADEJUMOKE",
  104: "DURODOLA ELIZABETH MERCY", 105: "IFEKOYA OLUWANIFEMI ISAAC", 106: "KOMOLAFE TOBILOBA FESTUS",
  107: "OBAIKE ANDREW OCHAPA", 108: "ODEYEMI KEHINDE SAMUEL", 109: "OGUNLADE TAIWO",
  110: "OGUNMUYITE AYOMIDE OWOSENI", 111: "OJO SUNDAY DAMILOLA", 112: "SALAMI AISHAT ABIKE",
  113: "SAMSON ALEX ENIOLA", 114: "AFENI SAMUEL OLUWAMAYOWA", 115: "IFAKOREDE AYOMIDE TOSIN",
  116: "AJIBOYE PRECIOUS AYO", 117: "", 118: "OLATUNJI AYOMIDE SAMUEL", 119: "OMOLADE SAMUEL AYOMIDE",
  120: "OWOADE TAIWO ANTHONIA", 121: "USMAN TESLIM OLAREWAJU", 122: "ADENIYI MALIK OLADIMEJI",
  123: "BELLO RUFAI OLAMILEKAN", 124: "JOSHUA OLUWATIMILEYIN OLAMILEKAN", 125: "NKPUNG FRIDAY GODWIN",
  126: "OJO ELIJAH OLUWASEGUN", 127: "OLANEGAN OMOTAYO", 128: "AYOMIDE ADEGBOYEGA EMMANUEL",
  129: "ABOGUN ISEOLUWA NELSON", 130: "ANEKWE CHUKWUNOSO MICHAEL", 131: "ENIMOLA TEMIDAYO AYOOLA",
  132: "OYEBADE FERANMI OLAMIPOSI", 133: "", 134: "ADEKOLA IDOWU OLUWANIFEMI", 135: "ENNIN SUNDAY FESTUS",
  136: "", 137: "", 138: "", 139: "", 140: "", 141: "", 142: "",
};

function pad4(n) {
  return String(n).padStart(4, "0");
}

function surnameOf(name) {
  return name.trim().split(/\s+/)[0] || "";
}

function generateDefaultVoters() {
  const voters = [];
  for (let i = 1; i <= 85; i++) {
    const matric = `FPA/CS/24/1-${pad4(i)}`;
    const name = ND24_NAMES[i] || "";
    const password = name ? surnameOf(name) : matric;
    voters.push({ matric, name, password, hasSetName: !!name });
  }
  for (let i = 1; i <= 142; i++) {
    const matric = `FPA/CS/25/1-${pad4(i)}`;
    const name = ND25_NAMES[i] || "";
    const password = name ? surnameOf(name) : matric;
    voters.push({ matric, name, password, hasSetName: !!name });
  }
  return voters;
}

// ---------- Small UI atoms ----------
function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-mono uppercase tracking-widest text-cyan-400/80 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={
        "w-full bg-[#0B1220] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none rounded-md px-3 py-2.5 text-slate-100 placeholder-slate-500 transition-colors " +
        (props.className || "")
      }
    />
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#0B1220] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none rounded-md pl-3 pr-10 py-2.5 text-slate-100 placeholder-slate-500 transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300"
        tabIndex={-1}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-cyan-400 text-slate-900 hover:bg-cyan-300 font-semibold",
    ghost: "bg-transparent border border-slate-600 text-slate-200 hover:border-cyan-400 hover:text-cyan-300",
    danger: "bg-red-500/90 text-white hover:bg-red-500",
    yes: "bg-emerald-500 text-white hover:bg-emerald-400",
    no: "bg-rose-500 text-white hover:bg-rose-400",
  };
  return (
    <button
      {...props}
      className={`px-4 py-2.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ---------- App ----------
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | voter-login | vote | admin-login | admin
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [ballot, setBallot] = useState({ votes: {}, records: {} }); // votes: {candId:{yes,no}}, records: {matric:[candId,...]}

  const [currentVoter, setCurrentVoter] = useState(null);
  const [sessionNotice, setSessionNotice] = useState("");

  // init load
  useEffect(() => {
    (async () => {
      let v = await storageGet("voters", true);
      if (!v) {
        v = generateDefaultVoters();
        await storageSet("voters", v, true);
      }
      let c = await storageGet("candidates", true);
      if (!c) c = [];
      let b = await storageGet("ballot", true);
      if (!b) b = { votes: {}, records: {} };
      setVoters(v);
      setCandidates(c);
      setBallot(b);
      setLoading(false);

      const session = loadSession();
      if (session && Date.now() - session.lastActivity < IDLE_LIMIT_MS) {
        if (session.type === "admin") {
          setScreen("admin");
        } else if (session.type === "voter") {
          const voter = v.find((x) => x.matric === session.matric);
          if (voter) {
            setCurrentVoter(voter);
            setScreen("vote");
          } else {
            clearSession();
          }
        }
      } else if (session) {
        clearSession();
      }
    })();
  }, []);

  // auto-logout after 5 minutes of inactivity, while logged in as voter or admin
  useEffect(() => {
    if (screen !== "vote" && screen !== "admin") return;

    function touchActivity() {
      const session = loadSession();
      if (session) {
        session.lastActivity = Date.now();
        saveSession(session);
      }
    }
    const events = ["click", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, touchActivity));

    const interval = setInterval(() => {
      const session = loadSession();
      if (!session || Date.now() - session.lastActivity >= IDLE_LIMIT_MS) {
        clearSession();
        setCurrentVoter(null);
        setSessionNotice("You were logged out after 5 minutes of inactivity.");
        setScreen("landing");
      }
    }, 15000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, touchActivity));
      clearInterval(interval);
    };
  }, [screen]);

  const refreshAll = useCallback(async () => {
    const [v, c, b] = await Promise.all([
      storageGet("voters", true),
      storageGet("candidates", true),
      storageGet("ballot", true),
    ]);
    if (v) setVoters(v);
    if (c) setCandidates(c);
    if (b) setBallot(b);
  }, []);

  // ---------- Voter login ----------
  function handleVoterLogin(matricRaw, password) {
    setError("");
    setSessionNotice("");
    const matric = matricRaw.trim().toUpperCase();
    const voter = voters.find((x) => x.matric.toUpperCase() === matric);
    if (!voter) {
      setError("Matric number not found in the voters register.");
      return;
    }
    if (voter.password !== password) {
      setError("Incorrect password.");
      return;
    }
    setCurrentVoter(voter);
    setScreen("vote");
    saveSession({ type: "voter", matric: voter.matric, lastActivity: Date.now() });
  }

  async function castVote(candidateId, choice) {
    if (!currentVoter) return;
    const alreadyVoted = !!(ballot.records[currentVoter.matric] || {})[candidateId];
    if (alreadyVoted) return;

    const fresh = (await storageGet("ballot", true)) || ballot;
    const votes = { ...fresh.votes };
    const cv = votes[candidateId] || { yes: 0, no: 0 };
    votes[candidateId] = { ...cv, [choice]: (cv[choice] || 0) + 1 };
    const records = { ...fresh.records };
    records[currentVoter.matric] = { ...(records[currentVoter.matric] || {}), [candidateId]: choice };

    const updated = { votes, records };
    setBallot(updated);
    await storageSet("ballot", updated, true);
  }

  // ---------- Admin login ----------
  function handleAdminLogin(password) {
    setError("");
    setSessionNotice("");
    if (password !== ADMIN_PASSWORD) {
      setError("Incorrect admin password.");
      return;
    }
    setScreen("admin");
    saveSession({ type: "admin", lastActivity: Date.now() });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center text-slate-400 font-mono text-sm">
        loading election data…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 font-sans">
      {screen === "landing" && (
        <Landing
          onVoter={() => { setSessionNotice(""); setScreen("voter-login"); }}
          onAdmin={() => { setSessionNotice(""); setScreen("admin-login"); }}
          notice={sessionNotice}
        />
      )}
      {screen === "voter-login" && (
        <VoterLogin
          onSubmit={handleVoterLogin}
          onBack={() => { setError(""); setScreen("landing"); }}
          error={error}
        />
      )}
      {screen === "vote" && currentVoter && (
        <VoteScreen
          voter={currentVoter}
          candidates={candidates}
          ballot={ballot}
          onVote={castVote}
          onLogout={() => { clearSession(); setCurrentVoter(null); setScreen("landing"); }}
        />
      )}
      {screen === "admin-login" && (
        <AdminLogin onSubmit={handleAdminLogin} onBack={() => { setError(""); setScreen("landing"); }} error={error} />
      )}
      {screen === "admin" && (
        <AdminDashboard
          voters={voters}
          setVoters={setVoters}
          candidates={candidates}
          setCandidates={setCandidates}
          ballot={ballot}
          setBallot={setBallot}
          refreshAll={refreshAll}
          onLogout={() => { clearSession(); setScreen("landing"); }}
        />
      )}
    </div>
  );
}

// ---------- Landing ----------
function Landing({ onVoter, onAdmin, notice }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> FEDPOLY Ado-Ekiti · NACOS
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-50 mb-2">Electoral Commission</h1>
        <p className="text-slate-400 mb-6">Cast your vote for the departmental executive elections. One matric number, one voice per post.</p>
        {notice && (
          <p className="text-amber-300 text-sm mb-6 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">{notice}</p>
        )}
        <div className="flex flex-col gap-3">
          <Button variant="primary" className="w-full flex items-center justify-center gap-2 py-3" onClick={onVoter}>
            <Vote size={18} /> Vote with your Matric Number
          </Button>
          <Button variant="ghost" className="w-full flex items-center justify-center gap-2 py-3" onClick={onAdmin}>
            <ShieldCheck size={18} /> Electoral Commission (Admin)
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Voter Login ----------
function VoterLogin({ onSubmit, onBack, error }) {
  const [matric, setMatric] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-[#121A2B] border border-slate-800 rounded-xl p-7">
        <h2 className="text-xl font-bold mb-1">Voter Login</h2>
        <p className="text-slate-400 text-sm mb-6">Use your matric number and password.</p>
        <Field label="Matric Number">
          <TextInput
            placeholder="FPA/CS/24/1-0001"
            value={matric}
            onChange={(e) => setMatric(e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Password">
          <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
        <Button className="w-full" onClick={() => onSubmit(matric, password)}>Log In</Button>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 text-sm mt-4 block mx-auto">← Back</button>
      </div>
    </div>
  );
}

// ---------- Admin Login ----------
function AdminLogin({ onSubmit, onBack, error }) {
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-[#121A2B] border border-slate-800 rounded-xl p-7">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Lock size={18} className="text-cyan-400" /> Admin Access</h2>
        <p className="text-slate-400 text-sm mb-6">Only the Electoral Commission chair can see results.</p>
        <Field label="Admin Password">
          <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
        <Button className="w-full" onClick={() => onSubmit(password)}>Enter Dashboard</Button>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 text-sm mt-4 block mx-auto">← Back</button>
      </div>
    </div>
  );
}

// ---------- Vote Screen ----------
function VoteScreen({ voter, candidates, ballot, onVote, onLogout }) {
  const posts = [...new Set(candidates.map((c) => c.post))];
  const votedFor = ballot.records[voter.matric] || {};

  return (
    <div className="min-h-screen px-5 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Welcome</p>
          <h1 className="text-2xl font-bold">{voter.name || voter.matric}</h1>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 text-sm">
          <LogOut size={16} /> Log out
        </button>
      </div>

      {candidates.length === 0 && (
        <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center text-slate-400">
          No positions have been opened for voting yet. Check back once the Electoral Commission publishes candidates.
        </div>
      )}

      {posts.map((post) => (
        <div key={post} className="mb-10">
          <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-cyan-400/80 mb-3 border-b border-slate-800 pb-2">{post}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {candidates.filter((c) => c.post === post).map((c) => {
              const voted = !!votedFor[c.id];
              return (
                <div key={c.id} className="bg-[#121A2B] border-2 border-slate-700 rounded-xl overflow-hidden">
                  <div className="aspect-square bg-slate-800 flex items-center justify-center overflow-hidden">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-slate-600" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-2xl leading-tight text-white">{c.name}</h3>
                    <p className="text-slate-400 text-sm mb-3">Contesting for {c.post}</p>
                    {voted ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                        <Check size={16} /> Vote recorded
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="yes" className="flex-1 flex items-center justify-center gap-1.5 py-2" onClick={() => onVote(c.id, "yes")}>
                          <Check size={16} /> Yes
                        </Button>
                        <Button variant="no" className="flex-1 flex items-center justify-center gap-1.5 py-2" onClick={() => onVote(c.id, "no")}>
                          <X size={16} /> No
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Admin Dashboard ----------
function AdminDashboard({ voters, setVoters, candidates, setCandidates, ballot, setBallot, refreshAll, onLogout }) {
  const [tab, setTab] = useState("results"); // results | candidates | voters

  return (
    <div className="min-h-screen px-5 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Electoral Commission</p>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 text-sm">
          <LogOut size={16} /> Log out
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {[
          { id: "results", label: "Results & Stats", icon: BarChart3 },
          { id: "candidates", label: "Candidates", icon: Vote },
          { id: "voters", label: "Voters", icon: Users },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors ${
              tab === t.id ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "results" && <ResultsTab voters={voters} candidates={candidates} ballot={ballot} setBallot={setBallot} refreshAll={refreshAll} />}
      {tab === "candidates" && <CandidatesTab candidates={candidates} setCandidates={setCandidates} />}
      {tab === "voters" && <VotersTab voters={voters} setVoters={setVoters} ballot={ballot} setBallot={setBallot} />}
    </div>
  );
}

function ResultsTab({ voters, candidates, ballot, setBallot, refreshAll }) {
  const totalVoters = voters.length;
  const votedMatrics = Object.keys(ballot.records).filter((m) => Object.keys(ballot.records[m] || {}).length > 0);
  const turnout = totalVoters ? Math.round((votedMatrics.length / totalVoters) * 100) : 0;

  async function resetCandidate(candidateId, candidateName) {
    if (!window.confirm(`Reset all votes for "${candidateName}"? This cannot be undone, and voters will be able to vote for this candidate again.`)) return;
    const fresh = (await storageGet("ballot", true)) || ballot;
    const votes = { ...fresh.votes };
    delete votes[candidateId];
    const records = {};
    Object.entries(fresh.records).forEach(([matric, choices]) => {
      const rest = { ...choices };
      delete rest[candidateId];
      records[matric] = rest;
    });
    const updated = { votes, records };
    setBallot(updated);
    await storageSet("ballot", updated, true);
  }

  async function resetAllVotes() {
    if (!window.confirm("Reset ALL votes for every candidate? This wipes the entire election's results and cannot be undone.")) return;
    if (!window.confirm("Are you absolutely sure? Type-check: this deletes every vote cast so far.")) return;
    const updated = { votes: {}, records: {} };
    setBallot(updated);
    await storageSet("ballot", updated, true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <Button variant="danger" className="flex items-center gap-1.5 text-sm py-1.5" onClick={resetAllVotes}>
          <Trash2 size={14} /> Reset all votes
        </Button>
        <Button variant="ghost" className="flex items-center gap-1.5 text-sm py-1.5" onClick={refreshAll}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat label="Registered Voters" value={totalVoters} />
        <Stat label="Have Voted" value={votedMatrics.length} />
        <Stat label="Turnout" value={`${turnout}%`} />
      </div>

      {candidates.length === 0 ? (
        <p className="text-slate-400 text-sm">Add candidates in the Candidates tab to see results here.</p>
      ) : (
        [...new Set(candidates.map((c) => c.post))].map((post) => (
          <div key={post} className="mb-8">
            <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-cyan-400/80 mb-3">{post}</h3>
            <div className="space-y-4">
              {candidates.filter((c) => c.post === post).map((c) => {
                const v = ballot.votes[c.id] || { yes: 0, no: 0 };
                const total = v.yes + v.no;
                const yesPct = total ? Math.round((v.yes / total) * 100) : 0;
                return (
                  <div key={c.id} className="bg-[#121A2B] border border-slate-800 rounded-lg p-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="font-medium">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{v.yes} yes · {v.no} no</span>
                        <button
                          onClick={() => resetCandidate(c.id, c.name)}
                          className="text-slate-500 hover:text-rose-400"
                          title="Reset votes for this candidate"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-rose-500/30 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${yesPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-[#121A2B] border border-slate-800 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-cyan-300">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function CandidatesTab({ candidates, setCandidates }) {
  const [post, setPost] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");

  async function persist(next) {
    setCandidates(next);
    await storageSet("candidates", next, true);
  }

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError("");
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`That photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB — please use one under 3MB.`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  }

  function addCandidate() {
    if (!post.trim() || !name.trim()) return;
    const c = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, post: post.trim(), name: name.trim(), image };
    persist([...candidates, c]);
    setPost(""); setName(""); setImage(""); setImageError("");
  }

  function removeCandidate(id) {
    persist(candidates.filter((c) => c.id !== id));
  }

  return (
    <div>
      <div className="bg-[#121A2B] border border-slate-800 rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-4">Add a Candidate</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Post / Category"><TextInput placeholder="President" value={post} onChange={(e) => setPost(e.target.value)} /></Field>
          <Field label="Candidate Name"><TextInput placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        </div>
        <Field label="Photo">
          <label className="flex items-center gap-2 border border-slate-700 border-dashed rounded-md px-3 py-2.5 text-slate-400 cursor-pointer hover:border-cyan-400">
            <Upload size={16} /> {image ? "Photo selected" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
          <p className="text-xs text-slate-500 mt-1.5">Max 3MB. Use a clear, well-lit photo — it's shown large on the ballot.</p>
          {imageError && <p className="text-rose-400 text-xs mt-1.5">{imageError}</p>}
        </Field>
        <Button className="flex items-center gap-1.5" onClick={addCandidate}><Plus size={16} /> Add Candidate</Button>
      </div>

      <div className="space-y-2">
        {candidates.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-[#121A2B] border border-slate-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              {c.image ? <img src={c.image} className="w-9 h-9 rounded object-cover" /> : <User size={20} className="text-slate-600" />}
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-slate-400">{c.post}</div>
              </div>
            </div>
            <button onClick={() => removeCandidate(c.id)} className="text-slate-500 hover:text-rose-400"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VotersTab({ voters, setVoters, ballot, setBallot }) {
  const [bulk, setBulk] = useState("");
  const [status, setStatus] = useState("");

  async function persist(next) {
    setVoters(next);
    await storageSet("voters", next, true);
  }

  async function clearVoterVotes(matric) {
    if (!window.confirm(`Clear all recorded votes for ${matric}? They will be able to vote again from scratch.`)) return;
    const fresh = (await storageGet("ballot", true)) || ballot;
    const theirChoices = fresh.records[matric] || {};
    const votes = { ...fresh.votes };
    Object.entries(theirChoices).forEach(([candidateId, choice]) => {
      const cv = votes[candidateId];
      if (cv) {
        votes[candidateId] = { ...cv, [choice]: Math.max(0, (cv[choice] || 0) - 1) };
      }
    });
    const records = { ...fresh.records };
    delete records[matric];
    const updated = { votes, records };
    setBallot(updated);
    await storageSet("ballot", updated, true);
  }

  function applyBulk() {
    // format per line: MATRIC,NAME,PASSWORD  (password optional -> keeps matric as password)
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    const map = {};
    lines.forEach((line) => {
      const [matric, name, password] = line.split(",").map((s) => s?.trim());
      if (matric) map[matric.toUpperCase()] = { name, password };
    });
    const updated = voters.map((v) => {
      const edit = map[v.matric.toUpperCase()];
      if (!edit) return v;
      return {
        ...v,
        name: edit.name || v.name,
        password: edit.password || v.password,
        hasSetName: !!edit.name,
      };
    });
    persist(updated);
    setStatus(`Updated ${Object.keys(map).length} voter record(s).`);
    setBulk("");
  }

  const registeredCount = voters.length;
  const namedCount = voters.filter((v) => v.hasSetName).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Registered Matric Numbers" value={registeredCount} />
        <Stat label="Names Assigned" value={namedCount} />
      </div>

      <div className="bg-[#121A2B] border border-slate-800 rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-2">Bulk set names / passwords</h3>
        <p className="text-slate-400 text-sm mb-3">
          One voter per line: <span className="font-mono text-cyan-300">MATRIC,NAME,PASSWORD</span> — password is optional; if left out, it defaults to the voter's surname (or their matric number if no name is on record).
        </p>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={5}
          placeholder={"FPA/CS/24/1-0001,Ada Lovelace,mypassword123\nFPA/CS/24/1-0002,Grace Hopper"}
          className="w-full bg-[#0B1220] border border-slate-700 focus:border-cyan-400 outline-none rounded-md px-3 py-2.5 text-slate-100 font-mono text-sm mb-3"
        />
        <Button onClick={applyBulk}>Apply</Button>
        {status && <p className="text-emerald-400 text-sm mt-3">{status}</p>}
      </div>

      <div className="bg-[#121A2B] border border-slate-800 rounded-xl overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f1626] text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2 font-mono">Matric</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Password</th>
                <th className="text-left px-4 py-2">Votes</th>
              </tr>
            </thead>
            <tbody>
              {voters.map((v) => {
                const voteCount = Object.keys(ballot.records[v.matric] || {}).length;
                return (
                  <tr key={v.matric} className="border-t border-slate-800/60">
                    <td className="px-4 py-2 font-mono text-cyan-300/90">{v.matric}</td>
                    <td className="px-4 py-2 text-slate-300">{v.name || <span className="text-slate-600">— not set —</span>}</td>
                    <td className="px-4 py-2 font-mono text-slate-500">{v.password}</td>
                    <td className="px-4 py-2">
                      {voteCount > 0 ? (
                        <button
                          onClick={() => clearVoterVotes(v.matric)}
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                          title="Clear this voter's votes"
                        >
                          <RefreshCw size={12} /> {voteCount} cast
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

