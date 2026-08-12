/* ============================================================
   Live Sports Display — GitHub Pages edition
   Fetches live scores client-side from ESPN's public scoreboard
   JSON. No backend, no API key. Auto-refreshes while games are
   live. Feeds real team colors into Neon Mode per panel.
   ============================================================ */
(function () {
    "use strict";

    window.NEON_EXTERNAL_COLORS = true;

    var LEAGUES = {
        nba:  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
        wnba: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard"
    };
    var league = "wnba";
    var timer = null;

    /* ESPN colors are official — often too dark to glow. Lift them. */
    function glow(hex) {
        if (!hex) return null;
        hex = hex.replace("#", "");
        if (hex.length !== 6) return null;
        var r = parseInt(hex.slice(0, 2), 16) / 255,
            g = parseInt(hex.slice(2, 4), 16) / 255,
            b = parseInt(hex.slice(4, 6), 16) / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        var l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
        if (d) {
            s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (mx === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        l = Math.max(l, 0.62);           /* bright enough to glow */
        s = Math.min(Math.max(s, 0.55), 0.95);
        return "hsl(" + Math.round(h * 360) + " " + Math.round(s * 100) + "% " + Math.round(l * 100) + "%)";
    }

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function leaderRows(comp) {
        var wrap = el("div", "lsd-leaders");
        (comp.leaders || []).forEach(function (cat) {
            var abbr = (cat.shortDisplayName || cat.abbreviation || "").toUpperCase();
            if (["PPG", "RPG", "APG", "PTS", "REB", "AST"].indexOf(abbr) === -1) return;
            var top = cat.leaders && cat.leaders[0];
            if (!top) return;
            var row = el("div", "players-stats-line lsd-leader-line");
            row.appendChild(el("span", "player-name", top.athlete ? top.athlete.shortName : "—"));
            row.appendChild(el("span", null, cat.shortDisplayName || cat.abbreviation));
            row.appendChild(el("span", null, top.displayValue));
            wrap.appendChild(row);
        });
        return wrap;
    }

    function gamePanel(ev) {
        var c = ev.competitions[0];
        var status = ev.status && ev.status.type ? ev.status.type : {};
        var live = status.state === "in";
        var panel = el("div", "section lsd-game" + (live ? " lsd-live" : ""));

        var head = el("div", "team-stats-line lsd-head");
        head.style.gridTemplateColumns = "3fr 1fr";
        head.appendChild(el("span", null, live ? "LIVE — " + (status.shortDetail || "") : (status.shortDetail || status.description || "")));
        head.appendChild(el("span", null, ""));
        panel.appendChild(head);

        var order = c.competitors.slice().sort(function (a) { return a.homeAway === "away" ? -1 : 1; });
        order.forEach(function (comp, i) {
            var line = el("div", "team-stats-line lsd-team-line");
            line.style.gridTemplateColumns = "3fr 1fr";
            var name = el("span", "lsd-team-name", comp.team.displayName);
            var score = el("span", "lsd-score", comp.score || "0");
            var col = glow(comp.team.color);
            if (col) {
                name.style.setProperty("--neon-b", col);
                name.style.color = "var(--neon-b)";
                score.style.color = col;
                score.style.textShadow = "0 0 10px " + col;
                if (i === 0) panel.style.setProperty("--neon-a", col);
                else panel.style.setProperty("--neon-b", col);
            }
            line.appendChild(name);
            line.appendChild(score);
            panel.appendChild(line);
            if (comp.leaders && comp.leaders.length) panel.appendChild(leaderRows(comp));
        });
        return panel;
    }

    function render(data) {
        var root = document.getElementById("scores");
        root.innerHTML = "";
        var events = (data && data.events) || [];
        if (!events.length) {
            var none = el("div", "section no-game", "No " + league.toUpperCase() + " games today. The LED panel sleeps.");
            root.appendChild(none);
            return;
        }
        var anyLive = false;
        events.forEach(function (ev) {
            if (ev.status && ev.status.type && ev.status.type.state === "in") anyLive = true;
            root.appendChild(gamePanel(ev));
        });
        /* refresh every 30s while a game is live, else every 5 min */
        clearTimeout(timer);
        timer = setTimeout(load, anyLive ? 30000 : 300000);
        var stamp = document.getElementById("updated");
        if (stamp) stamp.textContent = "Updated " + new Date().toLocaleTimeString();
    }

    function fetchJson(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        }).catch(function () {
            /* fallback: public CORS proxy, in case direct fetch is blocked */
            return fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url))
                .then(function (r) { return r.json(); });
        });
    }

    function load() {
        fetchJson(LEAGUES[league])
            .then(render)
            .catch(function () {
                var root = document.getElementById("scores");
                root.innerHTML = "";
                root.appendChild(el("div", "section no-game",
                    "Couldn't reach the scoreboard. Check your connection and reload."));
            });
    }

    function initSwitcher() {
        document.querySelectorAll("[data-league]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                league = btn.getAttribute("data-league");
                document.querySelectorAll("[data-league]").forEach(function (b) {
                    b.classList.toggle("lsd-active", b === btn);
                });
                load();
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initSwitcher();
        load();
    });
})();
