/* ============================================================
   NEON MODE — Motion Matrix Media
   Drop-in: <script src="{% static 'neon.js' %}" defer></script>
   - Injects neon.css (resolved relative to this script's URL)
   - Adds a NEON toggle to the nav, persisted in localStorage
   - Scans the page for NBA team names and re-tints the neon
     to that team's real colors. Two teams on page (live game)
     -> one accent per team.
   ============================================================ */
(function () {
    "use strict";

    var KEY = "mmm-neon";

    /* Real NBA team colors: [primary, secondary] */
    var TEAM_COLORS = {
        "hawks": ["#e03a3e", "#c1d32f"],
        "celtics": ["#00c853", "#f5f5f5"],
        "nets": ["#e0e0e0", "#9e9e9e"],
        "hornets": ["#00a9e0", "#a1a1e0"],
        "bulls": ["#ff4c52", "#f5f5f5"],
        "cavaliers": ["#ffb81c", "#a3195b"],
        "mavericks": ["#0091ff", "#b8c4ca"],
        "nuggets": ["#fec524", "#4d90cd"],
        "pistons": ["#1d9be3", "#ed4650"],
        "warriors": ["#ffc72c", "#1d90ff"],
        "rockets": ["#ff3d4d", "#c4ced4"],
        "pacers": ["#fdbb30", "#4d90cd"],
        "clippers": ["#4da6ff", "#ff4655"],
        "lakers": ["#fdb927", "#8b5cf6"],
        "grizzlies": ["#5d76a9", "#f5b112"],
        "heat": ["#ff4163", "#f9a01b"],
        "bucks": ["#00d68f", "#eee1c6"],
        "timberwolves": ["#78be20", "#5c9ee0"],
        "pelicans": ["#e31837", "#c8a760"],
        "knicks": ["#f58426", "#4d90cd"],
        "thunder": ["#ff8b2c", "#3aa8ff"],
        "magic": ["#1e90ff", "#c4ced4"],
        "76ers": ["#3d9bff", "#ff4655"],
        "sixers": ["#3d9bff", "#ff4655"],
        "suns": ["#e56020", "#b95af0"],
        "trail blazers": ["#ff4655", "#e0e0e0"],
        "blazers": ["#ff4655", "#e0e0e0"],
        "kings": ["#9d5cff", "#8fa3ad"],
        "spurs": ["#c4ced4", "#ff8fab"],
        "raptors": ["#ff5566", "#c0c0c0"],
        "jazz": ["#ffd166", "#7c3aed"],
        "wizards": ["#4d90fe", "#e31837"]
    };

    function cssUrl() {
        var s = document.currentScript || document.querySelector('script[src*="neon.js"]');
        return s ? s.src.replace(/neon\.js([?#].*)?$/, "neon.css") : "/static/neon.css";
    }

    function injectCss() {
        if (document.getElementById("neon-css")) return;
        var l = document.createElement("link");
        l.id = "neon-css";
        l.rel = "stylesheet";
        l.href = cssUrl();
        document.head.appendChild(l);
    }

    function teamsIn(text) {
        text = (text || "").toLowerCase();
        var found = [];
        for (var name in TEAM_COLORS) {
            var i = text.indexOf(name);
            if (i !== -1) found.push({ name: name, pos: i });
        }
        found.sort(function (a, b) { return a.pos - b.pos; });
        return found.map(function (f) { return f.name; });
    }

    /* Tint page accents to the teams found, in page order; each
       stats panel additionally gets tinted to its own team. */
    function detectTeams() {
        if (window.NEON_EXTERNAL_COLORS) return; /* colors driven by live data */
        var found = teamsIn(document.body.innerText);
        if (found.length) {
            var b = document.body;
            b.style.setProperty("--neon-a", TEAM_COLORS[found[0]][0]);
            b.style.setProperty(
                "--neon-b",
                found[1] ? TEAM_COLORS[found[1]][0] : TEAM_COLORS[found[0]][1]
            );
        }
        var panels = document.querySelectorAll(".game-stats-padding, .section");
        for (var i = 0; i < panels.length; i++) {
            var t = teamsIn(panels[i].innerText);
            if (t.length) {
                panels[i].style.setProperty("--neon-a", TEAM_COLORS[t[0]][0]);
                panels[i].style.setProperty("--neon-b", TEAM_COLORS[t[0]][0]);
            }
        }
    }

    /* Stagger index for the flicker-in on stat rows. */
    function indexRows() {
        var rows = document.querySelectorAll(".players-stats-line");
        for (var i = 0; i < rows.length; i++) {
            rows[i].style.setProperty("--i", i);
        }
    }

    function setNeon(on) {
        document.body.classList.toggle("neon", on);
        try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
        var btn = document.querySelector(".neon-toggle");
        if (btn) {
            btn.textContent = on ? "NEON: ON" : "NEON: OFF";
            btn.setAttribute("aria-pressed", on ? "true" : "false");
        }
        if (on) { detectTeams(); indexRows(); }
    }

    function addToggle() {
        var nav = document.querySelector(".nav");
        if (!nav || document.querySelector(".neon-toggle")) return;
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "neon-toggle";
        btn.setAttribute("aria-pressed", "false");
        btn.textContent = "NEON: OFF";
        btn.addEventListener("click", function () {
            setNeon(!document.body.classList.contains("neon"));
        });
        li.appendChild(btn);
        nav.appendChild(li);
    }

    function init() {
        injectCss();
        addToggle();
        var saved = "0";
        try { saved = localStorage.getItem(KEY) || "0"; } catch (e) {}
        if (saved === "1") setNeon(true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
