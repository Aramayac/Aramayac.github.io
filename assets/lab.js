/* Interactive lab: the final-year project infrastructure, explorable, with two replayed scenarios. */
(() => {
  const root = document.getElementById('lab'); if (!root) return;
  const L = document.documentElement.lang === 'en' ? 'en' : 'fr';
  const t = o => (o && typeof o === 'object' && !Array.isArray(o)) ? (o[L] ?? o.fr) : o;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = (p) => { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({path:p, title:p, event:true}); } catch(e){} };

  const UI = {
    fail: {fr:'Panne du pare-feu maître', en:'Master firewall failure'},
    scan: {fr:'Attaque : balayage de ports', en:'Attack: port scan'},
    reset: {fr:'Réinitialiser', en:'Reset'},
    hint: {fr:'Faites glisser le schéma et touchez un équipement.', en:'Swipe the diagram and tap a device.'},
    zone: {fr:'Zone', en:'Zone'}, addr: {fr:'Adresses', en:'Addresses'}, role: {fr:'Rôle', en:'Role'}, prot: {fr:'Ce qui le protège', en:'What protects it'},
    ready: {fr:'Prêt. Choisissez un scénario ou un équipement.', en:'Ready. Pick a scenario or a device.'},
    replay: {fr:'Rejoué d\'après mes tests réels (preuves dans l\'étude de cas)', en:'Replayed from my real tests (proof in the case study)'},
    attacker: {fr:'Attaquant · 192.168.207.164', en:'Attacker · 192.168.207.164'},
    blocked: {fr:'BLOQUÉ', en:'BLOCKED'}, maint: {fr:'MAINT.', en:'MAINT.'},
    zDMZ: 'DMZ', zADM: {fr:'LAN ADMINISTRATION', en:'ADMIN LAN'}, zUSR: {fr:'LAN UTILISATEURS', en:'USER LAN'},
    caseLink: {fr:'Lire l\'étude de cas complète →', en:'Read the full case study →'},
    caseHref: {fr:'projets/infrastructure-securisee.html', en:'projects/secure-infrastructure.html'},
    leg: {fr:['Pare-feu','Commutateur','Serveur ou poste'], en:['Firewall','Switch','Server or workstation']},
  };

  const N = {
    internet:{x:360,y:44,type:'cloud',name:'Internet',sub:'',
      kind:{fr:'Zone WAN',en:'WAN zone'}, zone:'WAN', ips:[{fr:'NAT VMware (VMnet8)',en:'VMware NAT (VMnet8)'}],
      role:{fr:'Internet, simulé par le NAT de VMware. C\'est d\'ici que partent mes tests d\'attaque, comme le ferait un attaquant extérieur.',en:'The Internet, simulated through VMware NAT. My attack tests start here, exactly as an outside attacker would.'},
      prot:[{fr:'Aucun accès direct au réseau interne : tout passe par le cluster pfSense.',en:'No direct path to the internal network: everything goes through the pfSense cluster.'}]},
    rtr:{x:360,y:118,type:'router',name:'RTR-WAN',sub:'Cisco IOS',lab:'r',
      kind:{fr:'Routeur Cisco IOS',en:'Cisco IOS router'}, zone:'WAN', ips:['f0/0 → Internet','f1/0 → SW-WAN'],
      role:{fr:'Routeur de bordure : il relie l\'entreprise à Internet et achemine le bloc public 200.100.10.0/29 vers les pare-feu.',en:'Edge router: it connects the company to the Internet and routes the public block 200.100.10.0/29 to the firewalls.'},
      prot:[{fr:'Seul point d\'entrée du réseau',en:'Single entry point into the network'},{fr:'Derrière lui, chaque flux est filtré par pfSense',en:'Behind it, every flow is filtered by pfSense'}]},
    swwan:{x:360,y:186,type:'switch',name:'SW-WAN',sub:'200.100.10.0/29',lab:'r',
      kind:{fr:'Commutateur WAN',en:'WAN switch'}, zone:'WAN', ips:['200.100.10.0/29',{fr:'Adresse publique virtuelle : 200.100.10.4',en:'Virtual public address: 200.100.10.4'}],
      role:{fr:'Il distribue le lien Internet aux deux pare-feu. Chacun peut ainsi reprendre l\'adresse publique virtuelle 200.100.10.4.',en:'It feeds the Internet link to both firewalls, so either one can take over the virtual public address 200.100.10.4.'},
      prot:[{fr:'Les deux pare-feu restent joignables si l\'un tombe',en:'Both firewalls stay reachable if one fails'}]},
    pfm:{x:200,y:276,type:'fw',name:'PF-MASTER',sub:'192.168.20.1',
      kind:{fr:'Pare-feu pfSense CE · actif',en:'pfSense CE firewall · active'}, zone:{fr:'Entre toutes les zones',en:'Between all zones'},
      ips:['WAN 200.100.10.2','DMZ 192.168.10.1','LAN_ADMIN 192.168.20.1','SYNC 172.16.0.1','VLAN 41–44 192.168.30.1 / .65 / .129 / .193'],
      role:{fr:'Le pare-feu principal. Il filtre chaque flux entre les zones selon la matrice des flux, refuse et journalise tout le reste, et porte les 7 adresses virtuelles CARP qui servent de passerelles.',en:'The main firewall. It filters every flow between zones according to the flow matrix, denies and logs everything else, and holds the 7 CARP virtual addresses used as gateways.'},
      prot:[{fr:'Refus par défaut journalisé',en:'Logged default deny'},{fr:'Suricata : jeu Emerging Threats et règle maison 9000001',en:'Suricata: Emerging Threats ruleset and custom rule 9000001'},{fr:'Blocage automatique de l\'attaquant',en:'Automatic blocking of the attacker'},{fr:'Configuration copiée vers le secours (XMLRPC)',en:'Configuration copied to the backup (XMLRPC)'}]},
    pfb:{x:520,y:276,type:'fw',name:'PF-BACKUP',sub:'192.168.20.2',
      kind:{fr:'Pare-feu pfSense CE · secours',en:'pfSense CE firewall · backup'}, zone:{fr:'Entre toutes les zones',en:'Between all zones'},
      ips:['LAN_ADMIN 192.168.20.2',{fr:'Lien SYNC dédié avec le maître',en:'Dedicated SYNC link to the master'}],
      role:{fr:'Le jumeau du maître. Il reçoit sa configuration et ses états de connexion en continu (pfsync) et reprend les 7 adresses virtuelles en 3 à 5 secondes si le maître tombe.',en:'The master\'s twin. It continuously receives its configuration and connection states (pfsync) and takes over the 7 virtual addresses within 3 to 5 seconds if the master fails.'},
      prot:[{fr:'Bascule testée et mesurée : 2 pings perdus',en:'Failover tested and measured: 2 pings lost'},{fr:'Connexions en cours conservées grâce à pfsync',en:'Open connections kept thanks to pfsync'},{fr:'Suricata actif lui aussi',en:'Suricata running here too'}]},
    swdmz:{x:96,y:374,type:'switch',name:'SW-DMZ',sub:'192.168.10.31',
      kind:{fr:'Commutateur Cisco · DMZ',en:'Cisco switch · DMZ'}, zone:'DMZ', ips:[{fr:'192.168.10.31 (supervision SNMP)',en:'192.168.10.31 (SNMP monitoring)'}],
      role:{fr:'Il relie la zone exposée aux deux pare-feu.',en:'It connects the exposed zone to both firewalls.'},
      prot:[{fr:'Zone séparée du LAN par le pare-feu : seuls les flux prévus par la matrice passent',en:'Zone separated from the LAN by the firewall: only flows in the matrix get through'},{fr:'Supervisé par Zabbix en SNMP',en:'Monitored by Zabbix over SNMP'}]},
    swadmin:{x:360,y:374,type:'switch',name:'SW-ADMIN',sub:'192.168.20.31',
      kind:{fr:'Commutateur Cisco · administration',en:'Cisco switch · admin'}, zone:{fr:'LAN administration',en:'Admin LAN'}, ips:[{fr:'192.168.20.31 (supervision SNMP)',en:'192.168.20.31 (SNMP monitoring)'}],
      role:{fr:'Il relie les serveurs d\'infrastructure et le poste d\'administration aux deux pare-feu.',en:'It connects the infrastructure servers and the admin workstation to both firewalls.'},
      prot:[{fr:'Supervisé par Zabbix en SNMP',en:'Monitored by Zabbix over SNMP'}]},
    swusers:{x:624,y:374,type:'switch',name:'SW-USERS',sub:'802.1Q',
      kind:{fr:'Commutateur Cisco · utilisateurs',en:'Cisco switch · users'}, zone:{fr:'LAN utilisateurs',en:'User LAN'}, ips:[{fr:'Trunk 802.1Q, VLAN 41 à 44',en:'802.1Q trunk, VLANs 41 to 44'}],
      role:{fr:'Il porte les quatre VLAN métiers jusqu\'aux pare-feu par un trunk 802.1Q.',en:'It carries the four business VLANs to the firewalls over an 802.1Q trunk.'},
      prot:[{fr:'Trunk durci : VLAN natif changé, VLAN autorisés limités',en:'Hardened trunk: native VLAN changed, allowed VLANs restricted'},{fr:'Filtrage par service sur pfSense',en:'Per-department filtering on pfSense'}]},
    srvdmz:{x:96,y:488,type:'server',name:'SRV-DMZ',sub:'192.168.10.10',
      kind:{fr:'Serveur Debian 13 · DMZ',en:'Debian 13 server · DMZ'}, zone:'DMZ', ips:['192.168.10.10'],
      role:{fr:'Il héberge les services visibles depuis Internet : le site web Nginx en HTTPS et la messagerie Postfix et Dovecot.',en:'It hosts the services visible from the Internet: the Nginx website over HTTPS and Postfix and Dovecot mail.'},
      prot:[{fr:'Certificats TLS signés par une autorité interne',en:'TLS certificates signed by an internal authority'},{fr:'HSTS, CSP et en-têtes de sécurité',en:'HSTS, CSP and security headers'},{fr:'Relais SMTP refusé, VRFY et ETRN désactivés',en:'SMTP relay denied, VRFY and ETRN disabled'},{fr:'Seulement 3 ports exposés après l\'audit',en:'Only 3 ports exposed after the audit'}]},
    dc1:{x:228,y:488,type:'server',name:'DC1',sub:'192.168.20.10',
      kind:{fr:'Windows Server · AD DS, DNS',en:'Windows Server · AD DS, DNS'}, zone:{fr:'LAN administration',en:'Admin LAN'}, ips:['192.168.20.10'],
      role:{fr:'Contrôleur de domaine principal : comptes, ordinateurs et stratégies de groupe de l\'entreprise.',en:'Primary domain controller: the company\'s accounts, computers and group policies.'},
      prot:[{fr:'GPO : mots de passe, verrouillage de session, blocage USB',en:'GPOs: passwords, session lock, USB blocking'},{fr:'Compte verrouillé après 5 mots de passe erronés',en:'Account locked after 5 wrong passwords'},{fr:'Unités organisationnelles par service',en:'Organisational units per department'}]},
    dc2:{x:302,y:488,type:'server',name:'DC2',sub:'192.168.20.12',
      kind:{fr:'Windows Server · AD DS, DNS',en:'Windows Server · AD DS, DNS'}, zone:{fr:'LAN administration',en:'Admin LAN'}, ips:['192.168.20.12'],
      role:{fr:'Contrôleur de domaine secondaire, répliqué avec DC1 : l\'annuaire reste disponible si DC1 tombe.',en:'Secondary domain controller, replicated with DC1: the directory stays available if DC1 fails.'},
      prot:[{fr:'0 échec de réplication',en:'Zero replication failures'},{fr:'Contrôles avec repadmin et gpresult',en:'Checked with repadmin and gpresult'}]},
    srvmon:{x:378,y:488,type:'server',name:'SRV-MON',sub:'192.168.20.20',
      kind:{fr:'Serveur de supervision Zabbix 7.0',en:'Zabbix 7.0 monitoring server'}, zone:{fr:'LAN administration',en:'Admin LAN'}, ips:['192.168.20.20'],
      role:{fr:'Il surveille 9 hôtes en continu, par agent (Windows, Linux) ou en SNMP (pfSense, commutateurs Cisco).',en:'It watches 9 hosts around the clock, by agent (Windows, Linux) or over SNMP (pfSense, Cisco switches).'},
      prot:[{fr:'Déclencheurs et alertes par courriel validés de bout en bout',en:'Triggers and email alerts validated end to end'}]},
    cadmin:{x:470,y:488,type:'pc',name:'CLIENT-ADMIN',sub:'192.168.20.50',
      kind:{fr:'Poste d\'administration Windows',en:'Windows admin workstation'}, zone:{fr:'LAN administration',en:'Admin LAN'}, ips:['192.168.20.50'],
      role:{fr:'Le poste depuis lequel j\'administre le réseau : pfSense, Zabbix et l\'annuaire.',en:'The workstation I manage the network from: pfSense, Zabbix and the directory.'},
      prot:[{fr:'Supervisé par Zabbix (agent)',en:'Monitored by Zabbix (agent)'}]},
    cw10:{x:624,y:484,type:'pc',name:'CLIENT-W10',sub:'VLAN 41–44',
      kind:{fr:'Poste utilisateur Windows 10',en:'Windows 10 user workstation'}, zone:{fr:'LAN utilisateurs',en:'User LAN'},
      ips:[{fr:'41 Direction · 192.168.30.0/26',en:'41 Management · 192.168.30.0/26'},'42 IT · 192.168.30.64/26',{fr:'43 Comptabilité · 192.168.30.128/26',en:'43 Accounting · 192.168.30.128/26'},{fr:'44 Commercial · 192.168.30.192/26',en:'44 Sales · 192.168.30.192/26'}],
      role:{fr:'Les postes des employés, répartis en quatre VLAN par service et configurés par DHCP. Chaque VLAN a sa passerelle virtuelle sur le cluster pfSense.',en:'Staff workstations, split into four VLANs by department and configured by DHCP. Each VLAN has its virtual gateway on the pfSense cluster.'},
      prot:[{fr:'Règles de filtrage par service',en:'Per-department filtering rules'},{fr:'Stratégies de groupe de l\'annuaire appliquées',en:'Directory group policies applied'},{fr:'Trafic parasite des postes Windows neutralisé par GPO',en:'Noisy Windows traffic neutralised by GPO'}]},
  };
  const LINKS = [['internet','rtr'],['rtr','swwan'],['swwan','pfm'],['swwan','pfb'],
    ['pfm','swdmz'],['pfm','swadmin'],['pfm','swusers'],['pfb','swdmz'],['pfb','swadmin'],['pfb','swusers'],
    ['swdmz','srvdmz'],['swadmin','dc1'],['swadmin','dc2'],['swadmin','srvmon'],['swadmin','cadmin'],['swusers','cw10']];

  /* ---------- SVG ---------- */
  const box = {cloud:[124,62], router:[46,46], switch:[56,32], fw:[66,48], server:[34,44], pc:[44,36]};
  const icon = (n) => {
    const {x,y} = n;
    switch (n.type) {
      case 'cloud': return `<g class="ic-cloud"><circle cx="${x-30}" cy="${y+4}" r="17"/><circle cx="${x}" cy="${y-6}" r="23"/><circle cx="${x+30}" cy="${y+4}" r="17"/><rect x="${x-47}" y="${y+2}" width="94" height="19" rx="9.5"/></g><text class="t1" x="${x}" y="${y+9}" text-anchor="middle">Internet</text>`;
      case 'router': return `<g class="ic-rtr"><circle cx="${x}" cy="${y}" r="20"/><path d="M${x-9} ${y-9}l18 18M${x+9} ${y-9}l-18 18M${x+9} ${y-9}h-6M${x+9} ${y-9}v6M${x-9} ${y+9}h6M${x-9} ${y+9}v-6"/></g>`;
      case 'switch': return `<g class="ic-sw"><rect x="${x-26}" y="${y-15}" width="52" height="30"/><path d="M${x-14} ${y-5}h28M${x+8} ${y-9}l6 4-6 4M${x+14} ${y+5}h-28M${x-8} ${y+1}l-6 4 6 4"/></g>`;
      case 'fw': return `<g class="ic-fw"><rect x="${x-31}" y="${y-22}" width="62" height="44"/><path d="M${x-31} ${y-8}h62M${x-31} ${y+7}h62M${x-12} ${y-22}v14M${x+12} ${y-22}v14M${x} ${y-8}v15M${x-20} ${y-8}v15M${x+20} ${y-8}v15M${x-12} ${y+7}v15M${x+12} ${y+7}v15"/></g>`;
      case 'server': return `<g class="ic-srv"><rect x="${x-15}" y="${y-20}" width="30" height="40"/><path d="M${x-9} ${y-11}h18M${x-9} ${y-4}h18M${x-9} ${y+3}h18"/><circle cx="${x+7}" cy="${y+12}" r="2"/></g>`;
      case 'pc': return `<g class="ic-pc"><rect x="${x-19}" y="${y-16}" width="38" height="25"/><path d="M${x} ${y+9}v6M${x-10} ${y+16}h20"/></g>`;
    }
  };
  const label = (n) => {
    if (n.type === 'cloud') return '';
    const [w,h] = box[n.type];
    if (n.lab === 'r') return `<text class="t1" x="${n.x + w/2 + 10}" y="${n.y + 1}">${n.name}</text><text class="t2" x="${n.x + w/2 + 10}" y="${n.y + 16}"> ${n.sub}</text>`;
    const y = n.y + h/2 + 17;
    return `<text class="t1" x="${n.x}" y="${y}" text-anchor="middle">${n.name}</text><text class="t2" x="${n.x}" y="${y + 14}" text-anchor="middle"> ${n.sub}</text>`;
  };
  const nodeSvg = (id) => { const n = N[id], [w,h] = box[n.type];
    return `<g class="ln" data-id="${id}" tabindex="0" role="button"><rect class="ring" x="${n.x-w/2-6}" y="${n.y-h/2-6}" width="${w+12}" height="${h+12}"/>${icon(n)}${label(n)}</g>`; };
  const zone = (x,w,lab) => `<g class="zone"><rect x="${x}" y="428" width="${w}" height="160"/><text class="tz" x="${x+10}" y="446">${esc(t(lab))}</text></g>`;
  const tag = (id) => { const n = N[id]; return `<g class="tag" id="tag-${id}"><rect x="${n.x-34}" y="${n.y-46}" width="68" height="18"/><text x="${n.x}" y="${n.y-33}" text-anchor="middle"></text></g>`; };

  const svg = `<svg class="lab-svg" viewBox="0 0 720 600" role="img" aria-label="${esc(L==='en'?'Interactive diagram of the infrastructure':'Schéma interactif de l\'infrastructure')}">
    ${zone(16,160,UI.zDMZ)}${zone(192,336,UI.zADM)}${zone(544,160,UI.zUSR)}
    <g id="lk">${LINKS.map(([a,b]) => `<line class="lk" data-a="${a}" data-b="${b}" x1="${N[a].x}" y1="${N[a].y}" x2="${N[b].x}" y2="${N[b].y}"/>`).join('')}</g>
    <line class="sync" x1="232" y1="276" x2="488" y2="276"/><text class="t2 sync-t" x="360" y="266" text-anchor="middle">CARP + pfsync</text>
    <g id="pk"></g>
    ${Object.keys(N).map(nodeSvg).join('')}
    ${tag('pfm')}${tag('pfb')}
    <g class="vl">${[41,42,43,44].map((v,i) => `<rect x="${572+i*28}" y="550" width="24" height="18"/><text x="${584+i*28}" y="563" text-anchor="middle">${v}</text>`).join('')}</g>
    <text class="atk" id="atk" x="430" y="30">${esc(t(UI.attacker))}</text>
    <g id="fx"></g>
  </svg>`;

  root.innerHTML = `<div class="lab-stage">
      <div class="lab-bar" role="group" aria-label="${L==='en'?'Scenarios':'Scénarios'}">
        <button type="button" data-s="fail" aria-pressed="false">${esc(t(UI.fail))}</button>
        <button type="button" data-s="scan" aria-pressed="false">${esc(t(UI.scan))}</button>
        <button type="button" class="reset" data-s="reset">${esc(t(UI.reset))}</button>
      </div>
      <div class="lab-scroll">${svg}</div>
      <p class="lab-hint">${esc(t(UI.hint))}</p>
    </div>
    <aside class="lab-panel"><div id="lab-info" aria-live="polite"></div><div class="lab-log" id="lab-log" role="log" aria-live="polite"></div></aside>`;

  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const info = $('#lab-info'), logEl = $('#lab-log'), pk = $('#pk'), fx = $('#fx');

  /* ---------- panel ---------- */
  const intro = () => `<p class="kind">${L==='en'?'Final-year project':'Projet de fin d\'études'}</p>
    <h3>${L==='en'?'Three zones, two firewalls.':'Trois zones, deux pare-feu.'}</h3>
    <p>${L==='en'?'Click any device on the diagram to see what it does and what protects it.':'Cliquez sur un équipement du schéma pour voir son rôle et ce qui le protège.'}</p>
    <ul class="kpi"><li><b>7</b>${L==='en'?'CARP virtual addresses':'adresses virtuelles CARP'}</li><li><b>4</b>${L==='en'?'business VLANs':'VLAN métiers'}</li><li><b>9</b>${L==='en'?'monitored hosts':'hôtes supervisés'}</li><li><b>3–5 s</b>${L==='en'?'failover':'de bascule'}</li></ul>
    <div class="leg"><span><i class="l-fw"></i>${UI.leg[L][0]}</span><span><i class="l-sw"></i>${UI.leg[L][1]}</span><span><i class="l-srv"></i>${UI.leg[L][2]}</span></div>
    <a class="lab-case" href="${t(UI.caseHref)}">${esc(t(UI.caseLink))}</a>`;
  const detail = (id) => { const n = N[id];
    return `<p class="kind">${esc(t(n.kind))}</p><h3>${esc(n.name)}</h3>
      <dl><div><dt>${t(UI.zone)}</dt><dd>${esc(t(n.zone))}</dd></div><div><dt>${t(UI.addr)}</dt><dd>${n.ips.map(i => `<span>${esc(t(i))}</span>`).join('')}</dd></div></dl>
      <p class="role">${esc(t(n.role))}</p>
      <p class="sub-h">${t(UI.prot)}</p><ul class="prot">${n.prot.map(p => `<li>${esc(t(p))}</li>`).join('')}</ul>
      <a class="lab-case" href="${t(UI.caseHref)}">${esc(t(UI.caseLink))}</a>`; };
  let sel = null;
  const select = (id, fromUser) => {
    sel = id; $$('.ln').forEach(g => g.classList.toggle('sel', g.dataset.id === id));
    info.innerHTML = id ? detail(id) : intro();
    if (fromUser) { count('lab-node-' + id);
      if (innerWidth < 760) { const r = info.getBoundingClientRect(); if (r.top > innerHeight * .8) info.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'start'}); } }
  };
  $$('.ln').forEach(g => {
    g.addEventListener('click', () => select(sel === g.dataset.id ? null : g.dataset.id, true));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(g.dataset.id, true); } });
  });

  /* ---------- log ---------- */
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, reduce ? 0 : ms));
  const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()); };
  const logReset = (head) => { logEl.innerHTML = `<p class="h">${esc(head)}</p>`; };
  const log = (time, msg, cls) => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = `<b>${esc(time)}</b> ${esc(msg)}`; logEl.append(p); logEl.scrollTop = logEl.scrollHeight; };

  /* ---------- state ---------- */
  const S = {active:'pfm', down:null, blackout:false, attack:false};
  const setTag = (id, txt, cls) => { const g = $('#tag-' + id); g.querySelector('text').textContent = txt; g.setAttribute('class', 'tag ' + cls); };
  const paint = () => {
    const other = S.active === 'pfm' ? 'pfb' : 'pfm';
    setTag(S.active, 'MASTER', 'm');
    if (S.down === other) setTag(other, t(UI.maint), 'x'); else setTag(other, 'BACKUP', 'b');
    $$('.ln').forEach(g => g.classList.toggle('down', g.dataset.id === S.down));
    $$('.lk').forEach(l => l.classList.toggle('off', l.dataset.a === S.down || l.dataset.b === S.down));
    root.querySelector('.sync').classList.toggle('off', !!S.down);
    $('#atk').classList.toggle('on', S.attack);
    $$('.ln').forEach(g => { if (g.dataset.id === 'internet') g.classList.toggle('evil', S.attack); });
  };

  /* ---------- packets ---------- */
  const P = [];
  const pathXY = ids => ids.map(id => [N[id].x, N[id].y]);
  const spawn = (ids, cls, onEnd) => {
    const pts = pathXY(ids); let len = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); seg.push(d); len += d; }
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', cls === 'red' ? 4.5 : 3.2); c.setAttribute('class', 'pkt ' + cls); pk.append(c);
    P.push({pts, seg, len, d:0, c, onEnd, v: cls === 'red' ? 260 : 170});
  };
  const flowUser = () => { const via = S.active;
    if (S.blackout) spawn(['cw10','swusers'], 'w'); else spawn(['cw10','swusers',via,'swwan','rtr','internet'], 'w'); };
  const flowWeb = () => { const via = S.active;
    if (S.blackout) spawn(['internet','rtr','swwan'], 'w'); else spawn(['internet','rtr','swwan',via,'swdmz','srvdmz'], 'w'); };
  const flowAdm = () => { if (!S.blackout) spawn(['srvmon','swadmin',S.active], 'b'); };
  const burst = (id) => { const n = N[id]; const r = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    r.setAttribute('cx', n.x); r.setAttribute('cy', n.y); r.setAttribute('r', 26); r.setAttribute('class', 'burst'); fx.append(r); setTimeout(() => r.remove(), 700); };
  let last = 0, run = false, visible = false, acc = {u:0, w:400, a:900};
  const step = (ts) => {
    if (!run) return;
    const dt = Math.min(64, ts - (last || ts)); last = ts;
    acc.u += dt; acc.w += dt; acc.a += dt;
    if (acc.u > 950) { acc.u = 0; flowUser(); }
    if (acc.w > 1500) { acc.w = 0; flowWeb(); }
    if (acc.a > 2600) { acc.a = 0; flowAdm(); }
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.d += p.v * dt / 1000;
      if (p.d >= p.len) { p.c.remove(); P.splice(i, 1); if (p.onEnd) p.onEnd(); continue; }
      let d = p.d, k = 0; while (d > p.seg[k]) { d -= p.seg[k]; k++; }
      const a = p.pts[k], b = p.pts[k+1], f = d / p.seg[k];
      p.c.setAttribute('cx', a[0] + (b[0]-a[0]) * f); p.c.setAttribute('cy', a[1] + (b[1]-a[1]) * f);
    }
    requestAnimationFrame(step);
  };
  const start = () => { if (reduce || run || !visible || document.hidden) return; run = true; last = 0; requestAnimationFrame(step); };
  const stop = () => { run = false; };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }, {threshold:.15}).observe(root);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  /* ---------- scenarios ---------- */
  const btns = $$('.lab-bar button');
  const press = (s) => btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === s)));
  const reset = (silent) => {
    clearTimers(); const wasDown = S.down;
    Object.assign(S, {active:'pfm', down:null, blackout:false, attack:false}); paint(); press(null);
    if (!silent) select(null);
    if (!silent) { logReset(t(UI.replay));
      if (wasDown) { log('+0 s', L==='en'?'PF-MASTER leaves maintenance and becomes MASTER again':'PF-MASTER quitte la maintenance et redevient MASTER', 'ok');
                     log('+0 s', L==='en'?'PF-BACKUP returns to BACKUP: cluster back to normal':'PF-BACKUP repasse en BACKUP : cluster revenu à l\'état normal', 'ok'); }
      else log('', t(UI.ready)); }
  };
  const card = (k) => { sel = null; $$('.ln').forEach(g => g.classList.remove('sel'));
    const C = {
      fail:{h:{fr:'Panne du maître',en:'Master failure'}, p:{fr:'Je mets PF-MASTER en maintenance, comme lors de mon test. Le secours doit reprendre les 7 adresses virtuelles sans intervention, et les utilisateurs ne perdre que quelques secondes.',en:'I put PF-MASTER into maintenance, as in my test. The backup must take over the 7 virtual addresses on its own, and users should only lose a few seconds.'}},
      scan:{h:{fr:'Balayage de ports',en:'Port scan'}, p:{fr:'Un attaquant extérieur balaie l\'adresse publique. Suricata doit le repérer, puis le pare-feu doit le bloquer avant qu\'il n\'atteigne la DMZ ou le LAN.',en:'An outside attacker scans the public address. Suricata must spot it, then the firewall must block it before it reaches the DMZ or the LAN.'}}}[k];
    info.innerHTML = `<p class="kind">${L==='en'?'Replayed scenario':'Scénario rejoué'}</p><h3>${esc(t(C.h))}</h3><p>${esc(t(C.p))}</p><a class="lab-case" href="${t(UI.caseHref)}#preuves">${L==='en'?'See the screenshots →':'Voir les captures →'}</a>`; };
  const fail = () => {
    reset(true); press('fail'); card('fail'); count('lab-scenario-failover'); logReset(t(UI.replay));
    S.down = 'pfm'; S.blackout = true; paint();
    log('+0 s', L==='en'?'PF-MASTER enters CARP maintenance mode':'PF-MASTER passe en maintenance CARP');
    later(700,  () => log('+1 s', L==='en'?'ping 192.168.20.254: request timed out':'ping 192.168.20.254 : délai d\'attente dépassé', 'bad'));
    later(1400, () => log('+2 s', L==='en'?'ping 192.168.20.254: request timed out':'ping 192.168.20.254 : délai d\'attente dépassé', 'bad'));
    later(2100, () => { S.active = 'pfb'; S.blackout = false; paint();
      log('+3 s', L==='en'?'PF-BACKUP takes the 7 virtual addresses (MASTER)':'PF-BACKUP prend les 7 adresses virtuelles (MASTER)', 'ok');
      log('+3 s', L==='en'?'Reply from 192.168.20.254: service restored':'Réponse de 192.168.20.254 : service rétabli', 'ok'); });
    later(2700, () => log('', L==='en'?'Measured failover: 3 to 5 s. Press Reset to bring the master back.':'Bascule mesurée : 3 à 5 s. « Réinitialiser » remet le maître en service.'));
  };
  const scan = () => {
    reset(true); press('scan'); card('scan'); count('lab-scenario-scan'); logReset(t(UI.replay));
    S.attack = true; paint();
    const target = S.active;
    const wave = (n, gap) => { for (let i = 0; i < n; i++) later(i * gap, () => spawn(['internet','rtr','swwan',target], 'red', () => burst(target))); };
    log('+0 s', L==='en'?'192.168.207.164 → 200.100.10.4: SYN burst on ports 20, 1123, 1352, 6007…':'192.168.207.164 → 200.100.10.4 : rafale de SYN sur les ports 20, 1123, 1352, 6007…');
    if (reduce) burst(target); else wave(9, 260);
    later(800,  () => log('+1 s', L==='en'?'Suricata: ET SCAN suspicious inbound to MSSQL 1433 and Oracle 1521':'Suricata : ET SCAN entrées suspectes vers MSSQL 1433 et Oracle 1521'));
    later(2400, () => log('+5 s', L==='en'?'Custom rule 9000001 “LAB SCAN SYN burst” fires':'Règle maison 9000001 « LAB SCAN SYN rafale » déclenchée', 'bad'));
    later(3000, () => { setTag(target, t(UI.blocked), 'r'); burst(target);
      log('+6 s', L==='en'?'Attacker blocked: packets dropped (DROP)':'Attaquant bloqué : paquets rejetés (DROP)', 'ok');
      log('+6 s', L==='en'?'DMZ and LAN untouched, alert logged':'DMZ et LAN intacts, alerte journalisée', 'ok'); });
    later(4600, () => { S.attack = false; paint(); press(null); });
  };
  btns.forEach(b => b.addEventListener('click', () => ({fail, scan, reset: () => reset(false)})[b.dataset.s]()));

  paint(); select(null); logReset('$'); log('', t(UI.ready));
  const sc = $('.lab-scroll'); requestAnimationFrame(() => { if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2; });
})();
