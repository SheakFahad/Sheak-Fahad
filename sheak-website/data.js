// ============ EDIT YOUR CONTENT HERE (no need to touch index.html) ============

const SHOW_DEMO = true;   // shows clearly-marked DEMO places + demo photos. Set to false when your real places are added.

// ================= TRAVEL JOURNAL =================
// Two parts: Bangladesh (district -> tourist spots) and Other Countries (country -> spots).
// PHOTOS ARE FOUND AUTOMATICALLY BY FOLDER NAME - you never write photo paths.
//   Bangladesh : images/travel/bangladesh/<district>/<spot>/1.jpg, 2.jpg, 3.jpg ...
//   Countries  : images/travel/world/<country>/<spot>/1.jpg, 2.jpg, 3.jpg ...
//   Folder name = the name in lowercase, spaces/symbols become "-"   e.g. "Cox's Bazar" -> cox-s-bazar, "Sajek Valley" -> sajek-valley
//   photos:10 means the spot shows 10 photos (1.jpg to 10.jpg). Use 12, 15 ... for more. .jpg .jpeg .png .webp all work.
//   Optional: folder:"images/travel/my/own/folder"  (to use a different folder),  lat/lng (shows a map pin; only add if you are sure of the location).
//
// ADD A DISTRICT:  copy a whole { district:"...", spots:[ ... ] } block.   ADD A SPOT: copy a { name:"...", ... } line inside spots.
const TRAVEL_BD = [
  // { district:"Rangamati", spots:[
  //     { name:"Sajek Valley", date:"2024-03", note:"1-2 lines about this place", photos:10 },
  //     { name:"Kaptai Lake",  date:"2024-03", note:"", photos:10 }
  // ] },
];
const TRAVEL_WORLD = [
  // { country:"Nepal", flag:"🇳🇵", spots:[
  //     { name:"Pokhara", date:"2025-01", note:"", photos:10 }
  // ] },
];
// ---- DEMO (sample layout only - not real trips). Delete these or set SHOW_DEMO=false.
const DEMO_BD = [
  { district:"Demo District 1", demo:true, spots:[
    { name:"Demo Spot A", date:"2024-01", note:"DEMO - replace with a real tourist spot you visited.", photos:10 },
    { name:"Demo Spot B", date:"2024-02", note:"DEMO - sample text.", photos:10 } ] },
  { district:"Demo District 2", demo:true, spots:[
    { name:"Demo Spot C", date:"2024-05", note:"DEMO - sample text.", photos:10 } ] }
];
const DEMO_WORLD = [
  { country:"Demo Country 1", flag:"🌍", demo:true, spots:[ { name:"Demo Spot D", date:"2025-01", note:"DEMO - sample text.", photos:10 } ] },
  { country:"Demo Country 2", flag:"🌍", demo:true, spots:[ { name:"Demo Spot E", date:"2025-03", note:"DEMO - sample text.", photos:10 } ] }
];

// ---- EDUCATION: one block per institution
const EDU = [
  { school:"Green University of Bangladesh",
    degree:"B.Sc. in Computer Science & Engineering",
    dates:"Add study dates", result:"Add verified result",
    summary:"Add a short summary of your university life here.",
    work:[   // projects, thesis, assignments, work you did
      { title:"Federated Digital Twin for personalised healthcare monitoring", note:"Thesis — add what you did and the result." }
    ],
    activities:[ "Add clubs, events, competitions, certificates…" ],
    memories:[ // { src:"images/uni/1.jpg", caption:"What happened" }
    ]
  }
];

// ---- LIFE & MEMORIES
const MEMORIES = [
  // { title:"Event", date:"Month Year", note:"Short note", photos:["images/uni/1.jpg"] },
];

// ---- CONTACT & SOCIAL (leave "" to hide a link). Use full https:// links; phone/whatsapp as numbers with country code.
const CONTACT = {
  email:"", phone:"", whatsapp:"",
  facebook:"", instagram:"", linkedin:"", tiktok:"", youtube:"", twitter:"", github:"",
  behance:"https://www.behance.net/sheakfahad"
};


// ================= PROFILE CONTENT (edit freely) =================
// Photo size guide is written next to every photo path. Put files in the images/ folders.
const ROLES = ["UI/UX Designer","Graphics Designer","Data Artist","Researcher"];

const ABOUT = {
  intro:"I’m a designer and researcher with a B.Sc. in Computer Science & Engineering from Green University of Bangladesh. I have worked across three companies — shaping clear interfaces, strong visuals and meaningful data stories — and I’m happiest when I’m exploring somewhere new.",
  photo:"images/about.jpg",   // portrait 900×1100
  loves:[["✈️","Travel","I love travelling — it’s what I enjoy most."],["🌾","Village","The village is my favourite place."],["🧭","New places","I’m always exploring somewhere new."]]
};

const EXPERIENCE = [   // photo/logo: 800×600
  { company:"Zensoft Lab", role:"UI/UX Designer", dates:"Add dates", photo:"images/work/zensoft.jpg", points:["Add what you designed and achieved here"] },
  { company:"Golden Harvest Infotech", role:"Data Artist", dates:"Add dates", photo:"images/work/goldenharvest.jpg", points:["Add what you worked on and achieved here"] },
  { company:"All Sheba Limited", role:"Graphics & UI/UX Designer", dates:"Add dates", photo:"images/work/allsheba.jpg", points:["Add what you designed and achieved here"] }
];

const SCHOOLS = [      // photo: 800×600
  { level:"SSC", school:"Union High School", year:"Add year", group:"Add group", result:"Add GPA", photo:"images/edu/ssc.jpg" },
  { level:"HSC", school:"MA Majid Science", year:"Add year", group:"Science", result:"Add GPA", photo:"images/edu/hsc.jpg" }
];

const PROJECTS = [     // image: 1200×750. did = the parts YOU did (add: "Research","Wireframing","Prototype","Branding"...)
  { title:"POS Dashboard & Analytics System", type:"Dashboard", summary:"Add a one-line summary.", did:["UI/UX Design"], image:"images/projects/pos.jpg", link:"" },
  { title:"Hair Salon Booking System", type:"Web App", summary:"Add a one-line summary.", did:["UI/UX Design"], image:"images/projects/salon.jpg", link:"" },
  { title:"Islamic Hub Application", type:"Mobile App", summary:"Add a one-line summary.", did:["UI/UX Design"], image:"images/projects/islamichub.jpg", link:"" },
  { title:"Healthcare Web Application", type:"Web App", summary:"Add a one-line summary.", did:["UI/UX Design"], image:"images/projects/healthcare.jpg", link:"https://advance-healthcare-sd246.web.app/" },
  { title:"UniNest", type:"Platform", summary:"Add a one-line summary.", did:["UI/UX Design"], image:"images/projects/uninest.jpg", link:"" }
];

const RESEARCH = {
  title:"Federated Digital Twin Framework for Personalised Healthcare Monitoring",
  status:"Thesis", domain:"Healthcare", method:"Federated Learning · Digital Twin",
  abstract:"Add your abstract, objectives, methodology, datasets and results here after you verify them.",
  tags:["Healthcare","Federated Learning","Digital Twin"], link:""
};

// I added common skills for your four roles — DELETE any you don’t have.
const SKILLS = [
  { icon:"🎨", title:"UI / UX Design", items:["UI Design","UX Design","Wireframing","Prototyping","Design Systems","Responsive Design","User Flows","Usability"] },
  { icon:"🖌️", title:"Graphics Design", items:["Branding","Logo Design","Typography","Social Media Design","Photo Editing","Print Design","Illustration"] },
  { icon:"📊", title:"Data Art & Research", items:["Data Visualization","Dashboard Design","Research Writing","Data Analysis","Technical Writing"] },
  { icon:"🛠️", title:"Tools", items:["Figma","Adobe Photoshop","Adobe Illustrator","Canva","HTML & CSS"] }
];
const ACHIEVEMENTS = [ { title:"Add an achievement", note:"Certificates, awards, competitions…" } ];

const HOBBY_WORDS = ["Travel","New places","Village","PUBG Mobile","eFootball","Movies","Turkish series","Football"];
const HOBBIES = [      // span: 2 = wide tile
  { icon:"✈️", title:"Travelling", text:"I love to travel. Every trip is a new story.", span:2 },
  { icon:"🌾", title:"Village life", text:"The village is my favourite place.", span:1 },
  { icon:"🧭", title:"Exploring new places", text:"New place, new feeling — I’m always up for it.", span:1 },
  { icon:"🎮", title:"Gaming", text:"PUBG Mobile and eFootball.", tags:["PUBG Mobile","eFootball"], span:1 },
  { icon:"🎬", title:"Movies & series", text:"Movies, and Turkish series.", tags:["Movies","Turkish series"], span:1 },
  { icon:"⚽", title:"Football", text:"Football is my favourite.", span:2 }
];

// ---- CONTACT FORM: leave "" to send through the visitor's email app. For direct delivery, make a free form at formspree.io
// and paste its URL here, e.g. "https://formspree.io/f/xxxxxxx"
const FORM_ENDPOINT = "";
