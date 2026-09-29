/* The SCAN029 case: seismic section, well control, attributes, SOM facies and SHAP. */
(() => {
  "use strict";

  const ZOOMS = { study: [0.0, 40.0], full: [0.0, 48.5], someren: [0.0, 21.0], well: [29.0, 40.0], custom: [0.0, 48.5] };
  const STUDY_T = [0.15, 2.0];   // the wells and both target intervals lie inside this window
  const MARGIN = { l: 58, r: 66, t: 70, b: 42 };   // top margin holds the labels, above the seismic
  const KEY_TOPS = new Set(["Rupel Clay Member", "Houthem Formation", "Zechstein Upper Claystone Formation",
    "Epen Formation", "Zeeland Formation", "Bosscheveld Formation"]);
  const PICK_MODE = new URLSearchParams(location.search).has("pick");
  const isSom = (s) => s >= 4 && s <= 7;   // stages 4-7 show SOM results; stage 8 (logs and crossplots) is shown fourth in the stage bar

  const GLOSSARY = {
    impedance: ["Acoustic impedance", "Density multiplied by P-wave velocity. A reflection forms where impedance changes across a boundary; the size and sign of the change set the reflection amplitude and polarity."],
    som: ["Self-organizing map (SOM)", "An unsupervised neural network that arranges prototype vectors on a 2D grid so that similar attribute combinations sit near each other (Kohonen, 1982). Each sample is assigned to its closest prototype, and here the prototypes are grouped into 8 classes."],
    neuron: ["Neuron", "One prototype on the SOM grid: a vector with one value per attribute. Each sample is assigned to the neuron whose prototype is closest to its attribute values, after each attribute is converted to standard deviations from its mean."],
    polarity: ["Polarity", "The SCAN029 data are zero phase, and the processing header states that an increase in acoustic impedance is recorded as a negative number. A boundary where impedance increases downward, such as shale over limestone, is therefore a trough."],
    helpSomGrid: ["Reading the trained map", "Clicking a neuron switches it on or off on the section; shift-click shows that neuron alone. Each square is one neuron of the SOM. A neuron is a prototype: one typical combination of the chosen attributes. Neurons next to each other hold similar combinations, so the colors blend smoothly across the grid, and the section is painted with the color of each sample's closest neuron. Samples with similar colors on the section have similar attribute values. The dark dots show how many samples went to each neuron; a large dot is a common combination, a missing dot is a neuron that no sample matched closely."],
    helpShapGlobal: ["Reading global SHAP", "Global SHAP describes the whole SOM: Each sample sits somewhere on the neuron grid. For each attribute, SHAP measures how far that attribute pushes a sample away from the average position on the grid. The bars average that distance over 400 random samples. A long bar means the SOM relies on that attribute to separate samples; a short bar means that attribute changes little about where samples land. The unit is a fraction of the grid width, so 0.10 on a 6 x 6 map is half a neuron, since the grid is five neuron spacings across. Attributes that repeat each other split the credit between them, so each can look less important than the information they share."],
    helpShapPath: ["Reading the path on the grid", "The hollow circle is where an average sample would land on the grid. Each arrow is one attribute's SHAP value for the clicked sample: the direction and distance that attribute moves the sample. The arrows are drawn largest first and added end to end, and the yellow dot is where the sample actually lands, the neuron that colors it on the section. Long arrows mark the attributes that decided this sample's color. Arrows pointing in opposite directions are attributes pulling the sample toward different parts of the map."],
    helpShapBars: ["Reading local SHAP", "Local SHAP describes one clicked sample. These bars give the length of each arrow in the path above: how far each attribute moves this one sample across the grid, as a fraction of the grid width. The global SHAP bars higher up average the same quantity over many samples, so an attribute can matter a great deal for one sample and little on average, or the reverse."],
    blocking: ["Log averaging window", "The logs are sampled every 0.1 m, less than 0.1 ms of two-way time here, while the attributes are exported every 4 ms and most are averaged over 62 ms. Each log is averaged over a window centered on each 4 ms attribute sample before the two are compared. A longer window removes thin beds from the log, so the log changes over distances closer to those over which the attributes change."],
    detrend: ["Trend with time", "Porosity decreases with depth as sediments compact, and several attributes also change with travel time; instantaneous frequency, for example, decreases as higher frequencies are attenuated. Two quantities that both change steadily with time correlate even without any link between them at a given depth. With this option a straight line against two-way time is fitted to the log and to the attribute over the samples shown, and the crossplot shows what is left after each line is subtracted."],
    correlation: ["Correlation coefficient (r)", "Pearson correlation between two quantities over a set of samples, from −1 to 1. Its square is the fraction of the variance of one quantity that a straight line through the points accounts for. With few samples r changes a lot from one set of samples to the next, so it is not computed for fewer than five samples."],
    helpWellPanel: ["Reading the well panel", "Two-way time runs down the panel, with measured depth on the left and two-way time on the right; the two scales are not proportional because velocity increases with depth. The first column shows the formations from the well tops, with an asterisk on candidate geothermal reservoirs. In each log track the thin gray curve is the log in 1 ms samples and the colored curve is the same log averaged over the chosen window at each 4 ms attribute sample. On the porosity track, density porosity is the solid curve and neutron porosity the dashed one. The last tracks show the attribute values along the well path, the values that go into the crossplot. Moving over the panel marks the same sample on the crossplot and on the section."],
    helpXplot: ["Reading the crossplot", "Each point is one 4 ms sample along the well: its attribute value across and its log value up, or, with two attributes, both attribute values with the log as the point color. The axes are fixed for each quantity, so changing the averaging window or the interval moves the points and not the axes. The dashed line is the least-squares straight line through the points, and n and r are given above the plot. In the two-attribute view the gray shading shows how often each attribute combination occurs along the line in the study window, darker where it is more common, so the well samples can be compared with the whole line. A closed polygon marks every sample on the section whose two attribute values fall inside it."],
    grcut: ["Gamma ray classes", "Gamma ray measures the natural radioactivity of the rock, most of it from potassium, thorium and uranium in clay minerals. Samples are split at the cutoff into two classes: gamma ray below the cutoff, often sand or carbonate, and gamma ray at or above it, often clay or shale. The split uses the gamma ray averaged over the chosen window at each 4 ms attribute sample. The cutoff sets where the boundary between the classes falls, so moving it changes which samples are in each class."],
    separation: ["Separation in standard deviations", "For each attribute, the mean of the high gamma ray class minus the mean of the low gamma ray class, divided by the pooled standard deviation of the two classes (Cohen's d). A value near zero means the two classes take similar attribute values; a value of 2 or more means their distributions barely overlap. The sign gives which class has the higher values. It is not computed when either class has fewer than five samples."],
    helpQiSep: ["Reading the separation bars", "One bar per attribute: how far apart that attribute places the low and high gamma ray classes, in standard deviations, for the same well, interval, averaging window and trend setting as the crossplot. A bar to the right means the attribute is higher in the high gamma ray class; a bar to the left means it is lower. The red bar is the attribute on the horizontal axis. Moving the cutoff changes which samples are in each class, and so which attributes separate them."],
    tieShift: ["Tie shift", "Neither well has a sonic log or checkshot, so the logs and formation tops are placed in two-way time with velocities from the seismic processing, and the tie between log and seismic can be off by several milliseconds. The slider moves the logs and tops down (positive) or up (negative) against the seismic, and the well panel, crossplot and bars use the moved logs. A result that changes a lot over a few milliseconds of shift depends on the tie."],
    attrGroups: ["What each group of attributes measures", "The bars are colored by what each attribute measures. Waveform attributes (blue: the stack amplitudes, relative acoustic impedance, AVT, the quadrature trace and the phase attributes) follow the oscillation of the trace between peaks and troughs, or are band-limited with no low frequencies, so their average over an interval is close to zero whatever the rock, and two classes rarely differ in their mean values. Quantitative interpretation reaches the properties of an interval from the same data by inversion with a low-frequency model, which this tool does not do. Envelope and energy attributes (brown: RMS amplitude, envelope, sweetness), amplitude change with angle measured on envelopes (purple: far minus near), frequency attributes (teal: instantaneous frequency, spectral ratio) and geometric attributes (gray: dip, dip variability, coherence) each turn the waveform into a measure of the character of an interval, so their averages can differ from one rock to another. The DQ attributes (rose) describe individual half cycles: DQ changes sign from one half cycle to the next, so like the waveform attributes its average over an interval is close to zero, and it is compared with logs sample by sample, as a curve shape, and not through interval averages."],
    helpQiCorr: ["Reading the correlation bars", "One bar per attribute: the correlation coefficient between that attribute and the log, for the same well, interval, averaging window and trend setting as the crossplot. A bar to the right means the attribute tends to be higher where the log is higher; a bar to the left means it tends to be lower. The red bar is the attribute on the horizontal axis. Switching the trend setting on and off shows which correlations come from both quantities changing with two-way time."],
    zscore: ["Standard deviations", "Each attribute is rescaled by subtracting its mean and dividing by its standard deviation over the whole window, so attributes with different units can be compared."],
    shap: ["SHAP values", "Shapley additive explanations (Lundberg and Lee, 2017). For one sample, each attribute receives the change it makes to the model output, averaged over the orders in which attributes can be added. Here the output is the sample's position on the SOM grid, which sets its color. The average position of all samples plus every attribute's SHAP value gives the sample's position. Values are estimated from random attribute orderings (Strumbelj and Kononenko, 2014)."],
  };

  const state = {
    stage: 1, zoom: "study", showWell: true, showHorizons: false, showUnits: false, seisMap: "gray_black", attrLut: "default", showInterp: true, hideControl: false,
    attr: "coherence", attrOpacity: 0.75, somOpacity: 0.75, verdictOpacity: 0.55, sample: null, explained: null, traceKm: 34.19,
    wiggles: true, wiggleGain: 1, wigglePx: 12,
    qi: { well: "ASTEN-GT-02", mode: "log", x: "rms_amplitude", y: "PHID", y2: "far_minus_near", color: "unit", colorLog: "GR", win: 0, detrend: false, unit: "all", poly: [], closed: false, hover: null, version: 0,
      cuts: { "ASTEN-GT-02": 65, "CAL-GT-04": 75 }, shift: 0 },
    runs: [], current: -1, busy: false, picked: new Set(), neurons: 6, somArea: "study", somT: [0.15, 2.0], zoomT: null, drag: null, compare: false, compareMode: "off", runA: 0, runB: 1, wipe: 0.5, compareCache: {}, showGeoColumns: true, geoFocus: null, showSomeren: true, showNames: true, showKarst: true, showFault: true, hiddenWells: new Set(),
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const cache = {};
  let meta, section, baseImg, overlay = null, overlayKey = "", autoHorizons, picks = {};

  const loadBin = async (name, Type) => {
    if (cache[name]) return cache[name];
    const r = await fetch(`data/${name}`);
    if (!r.ok) throw new Error(`Could not load data/${name} (${r.status}).`);
    return (cache[name] = new Type(await r.arrayBuffer()));
  };
  const makeCanvas = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 1 ? x.toFixed(1) : x.toFixed(2));
  const shortName = (f) => ({ instantaneous_phase: "Inst. phase", cos_instantaneous_phase: "Cos phase", quadrature_trace: "Quadrature", full_stack_amplitude: "Full amp.", near_stack_amplitude: "Near amp.", mid_stack_amplitude: "Mid amp.", far_stack_amplitude: "Far amp.", relative_acoustic_impedance: "Rel. AI", amplitude_volume_transform: "AVT", envelope: "Envelope", sweetness: "Sweetness", rms_amplitude: "RMS amp.", instantaneous_frequency: "Inst. freq.", spectral_ratio: "Spec. ratio",
    apparent_dip: "Dip", dip_variability: "Dip var.", coherence: "Coherence", far_minus_near: "Far − near",
    dq: "DQ", theta_px: "ThetaPX", dq_layer_average: "Average DQ", dq_layer_sum: "Sum DQ", signed_isochron: "Signed iso.", signed_half_isochron: "Half iso." }[f] || f);
  // last attribute sample with a value: the DQ attributes stop at 2.0 s, the others run to the end of the grid
  const lastJ = (k) => { const a = meta.attributes[k], g = meta.grid; return a && a.t_max != null ? Math.min(g.nt - 1, Math.round((a.t_max - meta.t_min) / g.dt)) : g.nt - 1; };
  const isDq = (k) => !!(meta.attributes[k] && meta.attributes[k].dq);
  function attrRaster(k, lut) {   // an attribute as an image, transparent where it has no values
    const g = meta.grid, nt = g.nt, jm = lastJ(k), d = cache[`attr_${k}.bin`];
    const c = raster(g.nx, nt, (i, j) => lut[d[i * nt + j]]);
    if (jm < nt - 1) { const ctx = c.getContext("2d"), id = ctx.getImageData(0, 0, g.nx, nt); for (let j = jm + 1; j < nt; j++) for (let i = 0; i < g.nx; i++) id.data[(j * g.nx + i) * 4 + 3] = 0; ctx.putImageData(id, 0, 0); }
    return c;
  }

  /* ---------- rasters ---------- */
  function raster(nx, nt, colorAt) {
    const c = makeCanvas(nx, nt), ctx = c.getContext("2d"), img = ctx.createImageData(nx, nt);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nt; j++) {
      const col = colorAt(i, j), p = (j * nx + i) * 4;
      img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); return c;
  }
  // In this dataset an increase in acoustic impedance is a negative number (zero-phase data, processing header).
  const SEIS_MAPS = {
    gray_black: { label: "Grayscale, impedance increase black", f: (v) => { const g = Math.max(0, Math.min(255, 128 + v * 1.6)); return [g, g, g]; } },
    gray_white: { label: "Grayscale, impedance increase white", f: (v) => { const g = Math.max(0, Math.min(255, 128 - v * 1.6)); return [g, g, g]; } },
    red_blue: { label: "Red–white–blue, impedance increase red", f: (v) => { const u = Math.max(-1, Math.min(1, v / 80)), e = u < 0 ? [178, 24, 43] : [33, 102, 172], t = Math.abs(u); return [247, 247, 247].map((x, k) => Math.round(x + (e[k] - x) * t)); } },
  };
  const grayAt = (i, j) => SEIS_MAPS[state.seisMap].f(section[i * meta.nt + j]);
  const DIVERGING = (() => { // blue - off-white - red
    const a = [49, 99, 173], b = [247, 244, 236], r = [190, 45, 40];
    return Array.from({ length: 256 }, (_, k) => { const u = k / 127.5 - 1, e = u < 0 ? a : r, t = Math.abs(u); return b.map((x, i) => Math.round(x + (e[i] - x) * t)); });
  })();

  async function buildOverlay() {
    const s = state.stage, g = meta.grid, nt = g.nt, tg = [meta.t_min - g.dt / 2, meta.t_min + (nt - 0.5) * g.dt];
    if (s === 3) {
      await loadBin(`attr_${state.attr}.bin`, Uint8Array); const lut = state.attrLut === "default" ? meta.attributes[state.attr].lut : meta.luts[state.attrLut].lut;
      return { img: attrRaster(state.attr, lut), km: [g.km_min, g.km_max], t: tg };
    }
    if (s === 8) return qiOverlay();
    if (isSom(s) && run()) return classOverlay(run());
    return null;
  }

  function classOverlay(r) {
    const g = meta.grid, nt = g.nt, tg = [meta.t_min - g.dt / 2, meta.t_min + (nt - 0.5) * g.dt];
    {
      const cols = neuronColors(r.side);
      const img = raster(g.nx, nt, (i, j) => { const k = r.bmu[i * nt + j]; return k === 255 ? [0, 0, 0] : cols[k]; });
      const cctx = img.getContext("2d"), id = cctx.getImageData(0, 0, g.nx, nt);
      const hidden = r.hidden || new Set();   // neurons switched off on the grid are left transparent
      for (let i = 0; i < g.nx; i++) for (let j = 0; j < nt; j++) { const k = r.bmu[i * nt + j]; if (k === 255 || hidden.has(k)) id.data[(j * g.nx + i) * 4 + 3] = 0; }
      cctx.putImageData(id, 0, 0);
      return { img, km: [g.km_min, g.km_max], t: tg };
    }
  }

  /* ---------- geometry ---------- */
  const cv = $("#section"), cx = cv.getContext("2d");
  let W = 0, H = 0;
  const view = () => { const [a, b] = ZOOMS[state.zoom], t = state.zoom === "custom" && state.zoomT ? state.zoomT : state.zoom === "study" ? STUDY_T : [meta.t_min, meta.t_max]; return { kmA: a, kmB: b, tA: t[0], tB: t[1] }; };
  const X = (km) => { const v = view(); return MARGIN.l + (km - v.kmA) / (v.kmB - v.kmA) * (W - MARGIN.l - MARGIN.r); };
  const Y = (t) => { const v = view(); return MARGIN.t + (t - v.tA) / (v.tB - v.tA) * (H - MARGIN.t - MARGIN.b); };
  const invX = (px) => { const v = view(); return v.kmA + (px - MARGIN.l) / (W - MARGIN.l - MARGIN.r) * (v.kmB - v.kmA); };
  const invY = (py) => { const v = view(); return v.tA + (py - MARGIN.t) / (H - MARGIN.t - MARGIN.b) * (v.tB - v.tA); };

  function resize() {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function compareOverlay(i) {
    const r = state.runs[i], key = `${r.id}:${[...(r.hidden || [])].sort((a, b) => a - b).join(".")}`;
    if (!state.compareCache[key]) state.compareCache[key] = classOverlay(r);
    return state.compareCache[key];
  }

  function drawCompare(alpha) {
    const xSplit = MARGIN.l + state.wipe * (W - MARGIN.l - MARGIN.r);
    for (const [i, x0, x1, name] of [[state.runA, MARGIN.l, xSplit, `Run ${state.runA + 1}`], [state.runB, xSplit, W - MARGIN.r, `Run ${state.runB + 1}`]]) {
      cx.save(); cx.beginPath(); cx.rect(x0, MARGIN.t, x1 - x0, H - MARGIN.t - MARGIN.b); cx.clip();
      drawRaster(compareOverlay(i), alpha); cx.restore();
      if (x1 - x0 > 60) topLabel((x0 + x1) / 2, `${name}: ${state.runs[i].features.length} attributes, ${state.runs[i].side ** 2} neurons`, "#dfe6e9");
    }
    cx.save(); cx.strokeStyle = "#fff"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(xSplit, MARGIN.t); cx.lineTo(xSplit, H - MARGIN.b); cx.stroke(); cx.restore();
  }

  function clipPlot() { cx.beginPath(); cx.rect(MARGIN.l, MARGIN.t, W - MARGIN.l - MARGIN.r, H - MARGIN.t - MARGIN.b); cx.clip(); }

  function drawRaster(o, alpha) {
    const nx = o.img.width, nt = o.img.height;
    // destination rectangle of the whole raster in canvas coordinates; the clip trims it to the view
    cx.save(); clipPlot(); cx.globalAlpha = alpha; cx.imageSmoothingEnabled = true;
    cx.drawImage(o.img, 0, 0, nx, nt, X(o.km[0]), Y(o.t[0]), X(o.km[1]) - X(o.km[0]), Y(o.t[1]) - Y(o.t[0]));
    cx.restore();
  }

  /* ---------- horizons (automatic near the well, replaced by picks where they exist) ---------- */
  function mergedHorizons() {
    const km = meta.horizons.km;
    return autoHorizons.map((h) => {
      const p = (picks[h.unit] || []).slice().sort((a, b) => a[0] - b[0]);
      if (p.length < 2) return h;
      const twt = h.twt.slice(), tracked = h.tracked.slice();
      km.forEach((k, i) => {
        if (k < p[0][0] || k > p[p.length - 1][0]) return;
        let j = 1; while (p[j][0] < k) j++;
        const [k0, t0] = p[j - 1], [k1, t1] = p[j];
        twt[i] = t0 + (t1 - t0) * (k - k0) / (k1 - k0 || 1); tracked[i] = 1;
      });
      return { ...h, twt, tracked, picked: true };
    });
  }
  const horizonsNow = () => (horizonsNow.v ??= mergedHorizons());
  const invalidateHorizons = () => { horizonsNow.v = null; };
  const hz = (unit) => horizonsNow().find((h) => h.unit === unit);

  /* ---------- drawing ---------- */
  let topLabels = [];
  const topLabel = (x, text, bg, fg = "#1f1d18") => { if (x >= MARGIN.l - 2 && x <= W - MARGIN.r + 2) topLabels.push({ x, text, bg, fg }); };

  function renderTopLabels() {
    // labels above the plot, placed in up to three rows so they do not overlap, with a tick down to the plot edge
    cx.save(); cx.font = "600 12px Barlow, Arial, sans-serif"; cx.textBaseline = "middle"; cx.textAlign = "left";
    const rows = [[], [], []], rowH = 19;
    for (const l of topLabels.sort((a, b) => a.x - b.x)) {
      const w = cx.measureText(l.text).width + 12;
      let x0 = Math.min(Math.max(l.x - w / 2, MARGIN.l), W - MARGIN.r - w), r = 0;
      for (; r < rows.length; r++) if (!rows[r].some(([a, b]) => x0 < b + 6 && x0 + w > a - 6)) break;
      if (r === rows.length) r = rows.length - 1;
      rows[r].push([x0, x0 + w]);
      const y = 4 + r * rowH;
      cx.strokeStyle = l.bg; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(l.x, y + 16); cx.lineTo(l.x, MARGIN.t); cx.stroke();
      cx.fillStyle = l.bg; cx.fillRect(x0, y, w, 16); cx.fillStyle = l.fg; cx.fillText(l.text, x0 + 6, y + 8);
    }
    cx.restore();
  }

  function withPanel(top, bottom, fn) {   // temporarily narrows the plot to one horizontal band
    const t = MARGIN.t, b = MARGIN.b; MARGIN.t = top; MARGIN.b = H - bottom;
    try { fn(); } finally { MARGIN.t = t; MARGIN.b = b; }
  }

  function drawPanelContents(runIdx, alpha, control, s) {
    drawRaster({ img: baseImg, km: [meta.km_min, meta.km_max], t: [meta.t_min, meta.t_max] }, 1);
    if (runIdx != null && state.runs[runIdx]) drawRaster(compareOverlay(runIdx), alpha);
    if (control && state.showHorizons) drawHorizons(true);
    if (control && state.showWell) drawWell();
    drawSomerenLimits();
    drawAxes(false);
    if (runIdx != null && state.runs[runIdx]) {
      const r = state.runs[runIdx], lab = `Run ${runIdx + 1}: ${r.features.length} attributes, ${r.side ** 2} neurons`;
      cx.save(); cx.font = "700 13px Barlow, Arial, sans-serif"; cx.textBaseline = "middle"; cx.textAlign = "left";
      const w = cx.measureText(lab).width + 12; cx.fillStyle = "#dfe6e9"; cx.fillRect(MARGIN.l + 6, MARGIN.t + 6, w, 20);
      cx.fillStyle = "#1f1d18"; cx.fillText(lab, MARGIN.l + 12, MARGIN.t + 16); cx.restore();
    }
  }

  function draw() {
    if (!meta || !W) return;
    topLabels = [];
    cx.clearRect(0, 0, W, H); cx.fillStyle = "#111"; cx.fillRect(0, 0, W, H);
    const s = state.stage, control = !(s === 1 && state.hideControl);
    const alpha = { 3: state.attrOpacity, 4: state.somOpacity, 5: state.somOpacity, 6: state.somOpacity, 7: state.verdictOpacity, 8: state.attrOpacity }[s];
    const comparing = isSom(s) && state.compare && state.runs[state.runA] && state.runs[state.runB];

    if (comparing && state.compareMode === "stacked") {
      // the same view of the line twice, one run above the other
      const top = MARGIN.t, bottom = H - MARGIN.b, gap = 16, mid = (top + bottom) / 2;
      withPanel(top, mid - gap / 2, () => drawPanelContents(state.runA, alpha, control, s));
      const keep = topLabels.length;   // the label band belongs to the upper panel only
      withPanel(mid + gap / 2, bottom, () => drawPanelContents(state.runB, alpha, control, s));
      topLabels.length = keep;
      renderTopLabels();
      return;
    }

    drawRaster({ img: baseImg, km: [meta.km_min, meta.km_max], t: [meta.t_min, meta.t_max] }, 1);
    if (((s === 1 && state.showUnits) || (s === 2 && state.showGeoColumns)) && control) drawWellColumns();
    if (comparing) drawCompare(alpha);
    else if (overlay && s > 2) drawRaster(overlay, alpha);
    if (control && state.showHorizons) drawHorizons(s !== 1);
    if (control && state.showWell) drawWell();
    drawSomerenLimits();
    if (s === 1 && PICK_MODE) drawPicks();
    if (s === 5 && state.sample) drawSampleMarker();
    if (s === 2) drawGeologyOverlay();
    if (wigglesOn()) drawWiggles();
    if (s === 8) drawQiMarker();
    drawHouthemPick();
    if (isSom(s) && run() && !comparing) { const w = run().window; cx.save(); clipPlot(); cx.setLineDash([10, 5]); cx.strokeStyle = "#ffffff"; cx.lineWidth = 1.5;
      cx.strokeRect(X(w.km[0]), Y(w.t[0]), X(w.km[1]) - X(w.km[0]), Y(w.t[1]) - Y(w.t[0])); cx.restore(); }
    drawAxes(control);
    renderTopLabels();
    const d = state.drag;
    if (d && d.moved) { cx.save(); cx.setLineDash([6, 4]); cx.strokeStyle = "#ffd166"; cx.lineWidth = 2; cx.fillStyle = "rgba(255,209,102,.12)";
      cx.fillRect(Math.min(d.x0, d.x1), Math.min(d.y0, d.y1), Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0));
      cx.strokeRect(Math.min(d.x0, d.x1), Math.min(d.y0, d.y1), Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0)); cx.restore(); }
  }

  const PICK_HALF_KM = 0.6;   // horizons are drawn as short picks this far either side of the well top
  const topKm = (unit) => { const t = meta.well.tops.find((x) => x.unit === unit); return t ? t.km : null; };
  const nearPick = (h, i) => h.picked || (topKm(h.unit) != null && Math.abs(meta.horizons.km[i] - topKm(h.unit)) <= PICK_HALF_KM);

  /* ---------- formation groups beside each well, after the scheme of Doornenbal et al. (2019, fig. 4) ---------- */
  const GROUPS = {
    N: { name: "North Sea Supergroup (Cenozoic)", color: "#f2d46b" },
    NU: { name: "Upper North Sea Group (Miocene–Quaternary)", color: "#f7e39a" },
    NM: { name: "Middle North Sea Group (Oligocene)", color: "#f2c94c" },
    NL: { name: "Lower North Sea Group (Paleocene–Eocene)", color: "#e0a93b" },
    CK: { name: "Chalk Group (Late Cretaceous–Danian)", color: "#9bd18b" },
    "ZE+RB": { name: "Zechstein and Lower Germanic Trias groups (Permian–Triassic)", color: "#a88bd1" },
    DC: { name: "Limburg Group (Namurian, Upper Carboniferous)", color: "#8ec9ea" },
    CL: { name: "Carboniferous Limestone Group (Dinantian)", color: "#7d8fa3" },
    OB: { name: "Banjaard Group (Devonian–?Dinantian)", color: "#b8906f" },
  };
  const WELL_GROUPS = {
    "CAL-GT-04": [["N", "Upper North Sea Group"], ["CK", "Houthem Formation"], ["ZE+RB", "Nederweert Sandstone Member"], ["DC", "Epen Formation"], ["CL", "Zeeland Formation"], ["OB", "Bosscheveld Formation"]],
    "CAL-GT-01": [["N", "Kieseloolite Formation"], ["CK", "Houthem Formation"], ["ZE+RB", "Nederweert Sandstone Member"], ["DC", "Epen Formation"], ["CL", "Zeeland Formation"]],
    "ASTEN-GT-02": [["NU", "Quaternary (undifferentiated)"], ["NM", "Someren Member"], ["NL", "Reusel Member"], ["CK", "Houthem Formation"]],
  };
  function drawWellColumns() {
    const half = 0.45; cx.save(); clipPlot();
    for (const wl of (meta.wells || []).filter((w) => !state.hiddenWells.has(w.name) && WELL_GROUPS[w.name])) {
      const gs = WELL_GROUPS[wl.name], last = wl.path[wl.path.length - 1];
      gs.forEach(([code, unit], i) => {
        const top = wl.tops.find((t) => t.unit === unit); if (!top) return;
        const nxt = i + 1 < gs.length ? wl.tops.find((t) => t.unit === gs[i + 1][1]) : last;
        const t0 = Math.max(top.twt, meta.t_min), k0 = top.km, t1 = nxt.twt, k1 = nxt.km;
        cx.beginPath(); cx.moveTo(X(k0 - half), Y(t0)); cx.lineTo(X(k0 + half), Y(t0)); cx.lineTo(X(k1 + half), Y(t1)); cx.lineTo(X(k1 - half), Y(t1)); cx.closePath();
        cx.globalAlpha = 0.45; cx.fillStyle = GROUPS[code].color; cx.fill(); cx.globalAlpha = 1;
        const xm = (X(k0) + X(k1)) / 2, ym = (Y(t0) + Y(t1)) / 2;
        if (Y(t1) - Y(t0) > 14 && X(k0 + half) - X(k0 - half) > 26) { cx.font = "700 11px Barlow, Arial, sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillStyle = "#10151a"; cx.fillText(code, xm, ym); }
      });
    }
    cx.restore();
  }

  /* ---------- geologic background: structural domains and events along the line ---------- */
  const DOMAINS = [
    { km: [0.0, 16.5], name: "Roer Valley Graben", color: "#f2c94c" },
    { km: [16.5, 18.5], name: "Peel Boundary Fault zone (approx.)", color: "#e76f51" },
    { km: [18.5, 48.5], name: "Peel Block (horst) and Venlo Block", color: "#8ec9ea" },
  ];
  function drawGeologyOverlay() {
    const y = MARGIN.t - 7;
    for (const d of DOMAINS) {
      const a = Math.max(X(d.km[0]), MARGIN.l), b = Math.min(X(d.km[1]), W - MARGIN.r); if (b <= a) continue;
      cx.fillStyle = d.color; cx.fillRect(a, y, b - a, 6);
      topLabel((a + b) / 2, d.name, d.color, "#10151a");
    }
    const f = state.geoFocus; if (!f) return;
    // outline of the area of interest, kept at least 36 px wide and tall so it stays visible on the whole line
    let x0 = X(f.km[0]), x1 = X(f.km[1]), y0 = Y(f.t[0]), y1 = Y(f.t[1]);
    if (x1 - x0 < 36) { const c = (x0 + x1) / 2; x0 = c - 18; x1 = c + 18; }
    if (y1 - y0 < 36) { const c = (y0 + y1) / 2; y0 = c - 18; y1 = c + 18; }
    cx.save(); clipPlot();
    cx.fillStyle = "rgba(0,0,0,0.35)";                       // dim everything outside the box
    cx.beginPath(); cx.rect(MARGIN.l, MARGIN.t, W - MARGIN.l - MARGIN.r, H - MARGIN.t - MARGIN.b); cx.rect(x1, y0, x0 - x1, y1 - y0); cx.fill("evenodd");
    cx.strokeStyle = "#000"; cx.lineWidth = 5; cx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    cx.strokeStyle = "#ffd166"; cx.lineWidth = 2.5; cx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    cx.font = "700 13px Barlow, Arial, sans-serif"; cx.textBaseline = "middle"; const tw = cx.measureText(f.label).width + 12;
    let lx = Math.min(Math.max(x0, MARGIN.l + 4), W - MARGIN.r - tw - 4), ly = y1 + 6; if (ly + 22 > H - MARGIN.b) ly = y0 - 28;
    cx.fillStyle = "#ffd166"; cx.fillRect(lx, ly, tw, 22); cx.fillStyle = "#1f1d18"; cx.textAlign = "left"; cx.fillText(f.label, lx + 6, ly + 11);
    cx.restore();
  }

  function drawSomerenLimits() {
    const [a, b] = meta.someren.km; cx.save(); clipPlot();
    cx.setLineDash([8, 6]); cx.lineWidth = 1.8; cx.strokeStyle = "rgba(118,183,178,.95)";
    for (const k of [a, b]) { cx.beginPath(); cx.moveTo(X(k), MARGIN.t); cx.lineTo(X(k), H - MARGIN.b); cx.stroke(); }
    cx.restore();
    const xm = (Math.max(X(a), MARGIN.l) + Math.min(X(b), W - MARGIN.r)) / 2;
    if (X(b) > MARGIN.l && X(a) < W - MARGIN.r) topLabel(xm, "Someren exploration license (approx.)", "#76b7b2", "#10201f");
  }

  function runs(n, ok) { const out = []; let a = -1; for (let i = 0; i <= n; i++) { if (i < n && ok(i)) { if (a < 0) a = i; } else if (a >= 0) { out.push([a, i - 1]); a = -1; } } return out; }

  function drawUnits(withNames) {
    const km = meta.horizons.km; cx.save(); clipPlot();
    for (const u of meta.units) {
      const base = hz(u.base), top = u.top ? hz(u.top) : null;
      const ref = u.top || u.base, near = (i) => topKm(ref) != null && Math.abs(km[i] - topKm(ref)) <= PICK_HALF_KM;
      for (const [a, b] of runs(km.length, (i) => near(i) && base.twt[i] != null && (!top || top.twt[i] != null))) {
        cx.beginPath();
        for (let i = a; i <= b; i++) { const y = top ? Y(top.twt[i]) : Y(meta.t_min); i === a ? cx.moveTo(X(km[i]), y) : cx.lineTo(X(km[i]), y); }
        for (let i = b; i >= a; i--) cx.lineTo(X(km[i]), Y(base.twt[i]));
        cx.closePath(); cx.globalAlpha = u.reservoir ? 0.42 : 0.24; cx.fillStyle = u.color; cx.fill();
      }
    }
    cx.restore();
    if (!withNames) return;
    cx.save(); clipPlot(); cx.font = "600 13px Barlow, Arial, sans-serif"; cx.textAlign = "right"; cx.textBaseline = "middle";
    for (const u of meta.units) {
      const base = hz(u.base), top = u.top ? hz(u.top) : null;
      const ok = (k) => Math.abs(km[k] - topKm(u.top || u.base)) <= PICK_HALF_KM && base.twt[k] != null && (!top || top.twt[k] != null);
      let i = -1; for (let k = km.length - 1; k >= 0; k--) if (km[k] < view().kmB - 0.3 && ok(k)) { i = k; break; }
      if (i < 0) continue;
      let a = i; while (a > 0 && ok(a - 1)) a--;
      if (X(km[i]) - X(Math.max(km[a], view().kmA)) < 60) continue;   // name only where the shaded pick is wide enough on screen
      const y = ((top ? Y(top.twt[i]) : Y(meta.t_min + 0.08)) + Y(base.twt[i])) / 2, xk = X(km[i]), w = cx.measureText(u.name).width + 12;
      cx.fillStyle = "rgba(239,229,200,.92)"; cx.fillRect(xk - w, y - 10, w, 20);
      cx.fillStyle = u.reservoir ? "#9d0208" : "#1f1d18"; cx.fillText(u.name, xk - 6, y);
    }
    cx.restore();
  }

  function drawHorizons(thin) {
    const km = meta.horizons.km; cx.save(); clipPlot();
    for (const h of horizonsNow()) {
      const valid = (i) => h.twt[i] != null && nearPick(h, i);
      cx.strokeStyle = h.color;
      for (const [solid, test] of [[true, (i) => valid(i) && h.tracked[i]], [false, (i) => valid(i) && !h.tracked[i]]]) {
        if (!solid && !state.showInterp) continue;
        cx.setLineDash(solid ? [] : [6, 5]); cx.lineWidth = solid ? (thin ? 1.6 : 2.4) : (thin ? 1.2 : 1.6);
        for (const [a, b] of runs(km.length, test)) {
          cx.beginPath(); const a0 = Math.max(0, a - 1), b0 = Math.min(km.length - 1, b + 1);
          for (let i = a0; i <= b0; i++) if (valid(i)) (i === a0 ? cx.moveTo : cx.lineTo).call(cx, X(km[i]), Y(h.twt[i]));
          cx.stroke();
        }
      }
    }
    cx.setLineDash([]); cx.font = "600 12px Barlow, Arial, sans-serif"; cx.textBaseline = "middle"; cx.textAlign = "left";
    cx.restore();
  }

  const WELL_STYLE = { "CAL-GT-04": { color: "#ffd166", labelDy: 0, zoom: "well", side: "right" }, "CAL-GT-01": { color: "#f4f1de", labelDy: 24, zoom: "well" },
    "ASTEN-GT-02": { color: "#cdb4db", labelDy: 26, zoom: "someren" } };
  // formations named as candidate geothermal reservoirs: the intervals tested in ASTEN-GT-02 (1987), under their names in the
  // 2021 TNO revision where the 1987 unit maps onto one unit, and the producing Dinantian carbonate at Californië
  const TARGETS = {
    "ASTEN-GT-02": new Set(["Voort Member", "Reusel Member", "Houthem Formation"]),
    "CAL-GT-04": new Set(["Zeeland Formation", "Houthem Formation"]),
    "CAL-GT-01": new Set(["Zeeland Formation"]),
  };
  const topLabelText = (wellName, unit) =>
    unit.replace(" Formation", " Fm").replace(" Member", " Mbr") + (TARGETS[wellName]?.has(unit) ? " *" : "");

  const LABELED_TOPS = { "CAL-GT-04": new Set(["Rupel Clay Member", "Houthem Formation", "Zechstein Upper Claystone Formation", "Epen Formation", "Zeeland Formation", "Bosscheveld Formation"]),
    "CAL-GT-01": new Set(["Veldhoven Formation", "Rupel Clay Member", "Houthem Formation", "Zeeland Formation"]),
    "ASTEN-GT-02": new Set(["Kieseloolite Formation", "Oosterhout Formation", "Groote Heide Formation", "Someren Member", "Wintelre Member",
      "Voort Member", "Boom Member", "Reusel Member", "Houthem Formation"]) };

  function drawWell() {
    const wells = meta.wells || [{ name: meta.well.name, path: meta.well.path, tops: meta.well.tops }];
    cx.save(); clipPlot(); cx.lineCap = "round";
    for (const wl of wells.filter((w) => !state.hiddenWells.has(w.name))) {
      const st = WELL_STYLE[wl.name] || { color: "#ffffff", labelDy: 48 }, p = wl.path;
      for (const [col, w] of [["#000", 5], [st.color, 2.4]]) {
        cx.strokeStyle = col; cx.lineWidth = w; cx.setLineDash(wl.estimated_path && col !== "#000" ? [6, 4] : []);
        cx.beginPath(); p.forEach((q, i) => (i ? cx.lineTo : cx.moveTo).call(cx, X(q.km), Y(q.twt))); cx.stroke();
      }
      cx.setLineDash([]);
      for (const t of wl.tops) {
        if (t.twt < meta.t_min) continue;
        const key = KEY_TOPS.has(t.unit) || LABELED_TOPS[wl.name]?.has(t.unit);
        cx.fillStyle = st.color; cx.globalAlpha = key ? 1 : 0.6;
        cx.beginPath(); cx.arc(X(t.km), Y(t.twt), key ? 4 : 2.5, 0, Math.PI * 2); cx.fill(); cx.globalAlpha = 1;
        // tops of this well that are not tracked horizons: a short tick and, in the well zoom, the name on the left
        if (LABELED_TOPS[wl.name]?.has(t.unit)) {
          cx.strokeStyle = st.color; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(X(t.km) - 10, Y(t.twt)); cx.lineTo(X(t.km) + 10, Y(t.twt)); cx.stroke();
        }
      }
      if (state.showNames) {
        // formation names beside the well, pushed apart so they do not overlap
        const right = st.side === "right", labs = wl.tops.filter((t) => LABELED_TOPS[wl.name]?.has(t.unit) && t.twt >= meta.t_min).sort((a, b) => a.twt - b.twt);
        cx.font = "600 11px Barlow, Arial, sans-serif"; cx.textBaseline = "middle"; let lastY = -Infinity;
        for (const t of labs) {
          const lab = topLabelText(wl.name, t.unit), tw = cx.measureText(lab).width + 8;
          let y = Y(t.twt); if (y - lastY < 14) y = lastY + 14; lastY = y;
          const x0 = right ? X(t.km) + 14 : X(t.km) - 14 - tw;
          cx.strokeStyle = st.color; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(X(t.km) + (right ? 10 : -10), Y(t.twt)); cx.lineTo(right ? x0 : x0 + tw, y); cx.stroke();
          cx.fillStyle = "rgba(20,24,26,.85)"; cx.fillRect(x0, y - 7, tw, 14);
          cx.fillStyle = st.color; cx.textAlign = "left"; cx.fillText(lab, x0 + 4, y);
        }
      }
      const off = p.map((q) => q.offset_m);
      const dist = Math.max(...off) - Math.min(...off) < 50 ? `${(off[0] / 1000).toFixed(1)} km` : `${(Math.min(...off) / 1000).toFixed(1)}–${(Math.max(...off) / 1000).toFixed(1)} km`;
      const label = `${wl.name}${wl.year ? ` (drilled ${wl.year})` : ""}, ${dist} from the line${wl.estimated_path ? ", path estimated" : ""}`;
      topLabel(X(p[0].km), label, st.color);
    }
    cx.restore();
  }

  function drawSampleMarker() {
    const x = X(state.sample.km), y = Y(state.sample.t); cx.save(); clipPlot();
    cx.lineWidth = 3; cx.strokeStyle = "#000"; cx.beginPath(); cx.arc(x, y, 9, 0, Math.PI * 2); cx.stroke();
    cx.lineWidth = 1.8; cx.strokeStyle = "#ffd166"; cx.beginPath(); cx.arc(x, y, 9, 0, Math.PI * 2); cx.stroke(); cx.restore();
  }

  function drawPicks() {
    const unit = $("#pickHorizon").value, h = meta.horizons.items.find((x) => x.unit === unit), p = picks[unit] || [];
    cx.save(); clipPlot();
    for (const [k, t] of p) { cx.fillStyle = "#000"; cx.beginPath(); cx.arc(X(k), Y(t), 5, 0, Math.PI * 2); cx.fill(); cx.fillStyle = h.color; cx.beginPath(); cx.arc(X(k), Y(t), 3.5, 0, Math.PI * 2); cx.fill(); }
    cx.restore();
  }

  function niceStep(range, target) { const raw = range / target, mag = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw); }

  function drawAxes(depthAxis) {
    const v = view(); cx.save();
    cx.strokeStyle = "#dfe6e9"; cx.lineWidth = 1; cx.strokeRect(MARGIN.l, MARGIN.t, W - MARGIN.l - MARGIN.r, H - MARGIN.t - MARGIN.b);
    cx.fillStyle = "#dfe6e9"; cx.font = "13px Barlow, Arial, sans-serif";
    const ks = niceStep(v.kmB - v.kmA, 10); cx.textAlign = "center"; cx.textBaseline = "top";
    for (let k = Math.ceil(v.kmA / ks) * ks; k <= v.kmB + 1e-9; k += ks) { const x = X(k); cx.fillRect(x, H - MARGIN.b, 1, 5); cx.fillText(k.toFixed(ks < 1 ? 1 : 0), x, H - MARGIN.b + 7); }
    cx.fillText("Distance along SCAN029 (km)", (MARGIN.l + W - MARGIN.r) / 2, H - 18);
    cx.textAlign = "right"; cx.textBaseline = "middle";
    const ts = niceStep(v.tB - v.tA, 8);
    for (let t = Math.ceil(v.tA / ts) * ts; t <= v.tB + 1e-9; t += ts) { const y = Y(t); cx.fillRect(MARGIN.l - 5, y, 5, 1); cx.fillText(t.toFixed(ts < 0.1 ? 2 : 1), MARGIN.l - 8, y); }
    cx.save(); cx.translate(16, (MARGIN.t + H - MARGIN.b) / 2); cx.rotate(-Math.PI / 2); cx.textAlign = "center"; cx.fillText("Two-way time (s)", 0, 0); cx.restore();
    if (depthAxis || state.zoom === "someren") {
      cx.textAlign = "left";
      const someren = state.zoom === "someren", axis = someren ? meta.someren.depth_axis.axis : meta.well.depth_axis;
      for (const d of axis) { if (d.depth % 500 || d.twt < v.tA || d.twt > v.tB) continue; const y = Y(d.twt); cx.fillRect(W - MARGIN.r, y, 5, 1); cx.fillText(String(d.depth), W - MARGIN.r + 8, y); }
      cx.save(); cx.translate(W - 12, (MARGIN.t + H - MARGIN.b) / 2); cx.rotate(Math.PI / 2); cx.textAlign = "center"; cx.fillText(someren ? `Depth below NAP at ${meta.someren.depth_axis.km} km, from migration velocities (m)` : `Depth below NAP at ${meta.well.name} (m)`, 0, 0); cx.restore();
    }
    cx.restore();
  }

  /* ---------- side panels ---------- */
  function drawColorbar() {
    const a = meta.attributes[state.attr], c = $("#colorbar"), g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height);
    (state.attrLut === "default" ? a.lut : meta.luts[state.attrLut].lut).forEach((col, i) => { g.fillStyle = `rgb(${col})`; g.fillRect(i / 256 * c.width, 0, c.width / 256 + 1, 20); });
    g.fillStyle = "#1f1d18"; g.font = "12px Barlow, Arial, sans-serif"; g.textBaseline = "top";
    g.textAlign = "left"; g.fillText(fmt(a.min), 0, 24); g.textAlign = "right"; g.fillText(fmt(a.max), c.width, 24); g.textAlign = "center"; g.fillText(a.unit, c.width / 2, 24);
    $("#attrMeasures").textContent = a.measures; $("#attrGeology").textContent = a.geology; $("#attrSource").textContent = a.source;
  }

  function hbars(canvas, labels, values, { min, max, colors, title, zeroLine = true, valueFmt = (v) => v.toFixed(2), labelOpposite = false }) {
    const g = canvas.getContext("2d"), w = canvas.width, h = canvas.height, left = 74, right = 30, top = title ? 20 : 6, bottom = 18;
    g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, h);
    const X0 = (v) => left + (v - min) / (max - min) * (w - left - right), rowH = (h - top - bottom) / labels.length;
    g.font = "12px Barlow, Arial, sans-serif"; g.textBaseline = "middle";
    if (title) { g.fillStyle = "#1f1d18"; g.textAlign = "left"; g.fillText(title, 6, 10); }
    g.strokeStyle = "#cfc4a6"; g.lineWidth = 1;
    const ticks = niceStep(max - min, 4);
    g.fillStyle = "#5a5446"; g.textAlign = "center"; g.font = "11px Barlow, Arial, sans-serif";
    for (let t = Math.ceil(min / ticks) * ticks; t <= max + 1e-9; t += ticks) { const x = X0(t); g.beginPath(); g.moveTo(x, top); g.lineTo(x, h - bottom); g.stroke(); g.fillText(fmt(t), x, h - bottom + 10); }
    if (zeroLine) { g.strokeStyle = "#1f1d18"; g.beginPath(); g.moveTo(X0(0), top); g.lineTo(X0(0), h - bottom); g.stroke(); }
    labels.forEach((lab, i) => {
      const y = top + i * rowH + rowH / 2, v = values[i], vc = Number.isNaN(v) ? 0 : Math.max(min, Math.min(max, v));
      g.fillStyle = "#1f1d18"; g.textAlign = "right"; g.font = "12px Barlow, Arial, sans-serif"; g.fillText(lab, left - 6, y);
      g.fillStyle = colors[i]; g.fillRect(Math.min(X0(0), X0(vc)), y - rowH * 0.32, Math.abs(X0(vc) - X0(0)), rowH * 0.64);
      g.fillStyle = "#1f1d18"; g.font = "11px Barlow, Arial, sans-serif";
      if (labelOpposite) { g.textAlign = v >= 0 ? "right" : "left"; g.fillText(valueFmt(v), X0(0) + (v >= 0 ? -4 : 4), y); }   // value on the empty side of the zero line
      else { g.textAlign = v >= 0 ? "left" : "right"; g.fillText(valueFmt(v), X0(vc) + (v >= 0 ? 4 : -4), y); }
    });
  }

  /* ---------- state changes ---------- */
  const run = () => state.runs[state.current] || null;

  async function refresh() {
    const r = run(), key = state.stage <= 2 ? "" : state.stage === 3 ? `a:${state.attr}:${state.attrLut}` : state.stage === 8 ? qiOverlayKey() : `s:${r ? r.id + ":" + [...(r.hidden || [])].sort((a, b) => a - b).join(".") : "none"}`;
    if (key !== overlayKey) { overlay = key && !key.endsWith("none") ? await buildOverlay() : null; overlayKey = key; }
    $$(".dqWiggle").forEach((el) => (el.hidden = !isDq(state.attr)));
    $$(".dqWiggle8").forEach((el) => (el.hidden = !(state.qi.mode === "log" && isDq(state.qi.x))));
    if (wigglesOn() && !dqWiggle) await loadWiggle();
    if (state.stage === 8) drawQi();
    drawPickProfile();
    drawSomGrid($("#somGrid")); drawSomGrid($("#somGridVerdict")); updateNeuronInfo();
    for (const [id, idx] of [["#somGridA", state.runA], ["#somGridB", state.runB]]) { const c = $(id); if (c && state.runs[idx]) drawGridFor(c, state.runs[idx]); } drawShapGlobal(); drawShapSample();
    draw();
  }

  function setZoom(z) { state.zoom = z; if (z !== "custom") state.zoomT = null; $$("[data-zoom]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.zoom === z))); }
  function setStage(n) {
    state.stage = n;
    if (n === 4 || n === 6) syncPicks();
    if (n === 7) setZoom("someren");
    if (n === 2) setZoom("study");
    $$(".tag").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.stage === n)));
    $$(".card[data-for]").forEach((c) => (c.hidden = +c.dataset.for !== n));
    $("#qiPanel").hidden = n !== 8; document.body.classList.toggle("stage-qi", n === 8);
    $(".notes").scrollTop = 0;
    refresh();
  }

  /* 2D color bar: bilinear blend of four corner colors across the neuron grid */
  const CORNERS = [[44, 123, 182], [215, 25, 28], [255, 217, 47], [26, 152, 80]];   // top-left, top-right, bottom-left, bottom-right
  function neuronColors(side) {
    const out = [];
    for (let r = 0; r < side; r++) for (let c = 0; c < side; c++) {
      const u = side > 1 ? c / (side - 1) : 0.5, v = side > 1 ? r / (side - 1) : 0.5;
      out.push([0, 1, 2].map((i) => Math.round((1 - u) * (1 - v) * CORNERS[0][i] + u * (1 - v) * CORNERS[1][i] + (1 - u) * v * CORNERS[2][i] + u * v * CORNERS[3][i])));
    }
    return out;
  }

  function drawGridFor(c, r) { const keep = state.current; state.current = state.runs.indexOf(r); drawSomGrid(c); state.current = keep; }

  function drawSomGrid(c, path) {
    const g = c.getContext("2d"), w = c.width, pad = 10; g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, c.height);
    const r = run();
    if (!r) { g.fillStyle = "#5a5446"; g.font = "13px Barlow, Arial, sans-serif"; g.textAlign = "center"; g.fillText("No SOM trained yet", w / 2, c.height / 2); return; }
    const cols = neuronColors(r.side), cell = (w - 2 * pad) / r.side, maxHit = Math.max(...r.hits);
    for (let k = 0; k < r.side * r.side; k++) {
      const x = pad + (k % r.side) * cell, y = pad + Math.floor(k / r.side) * cell;
      const off = !path && r.hidden && r.hidden.has(k);
      g.globalAlpha = off ? 0.18 : 1; g.fillStyle = `rgb(${cols[k]})`; g.fillRect(x + 1, y + 1, cell - 2, cell - 2); g.globalAlpha = 1;
      if (off) { g.strokeStyle = "rgba(90,84,70,.6)"; g.lineWidth = 1; g.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3); }
      if (!path) { const rad = Math.sqrt(r.hits[k] / maxHit) * cell * 0.35; g.fillStyle = "rgba(20,20,20,.55)"; g.beginPath(); g.arc(x + cell / 2, y + cell / 2, Math.max(rad, r.hits[k] > 0 ? 1.5 : 0), 0, Math.PI * 2); g.fill(); }
    }
    if (path) {
      const P = (p) => [pad + (p[0] + 0.5) * cell, pad + (p[1] + 0.5) * cell];
      let cur = path.base.slice();
      g.lineWidth = 2.5; g.font = "600 11px Barlow, Arial, sans-serif"; g.textBaseline = "middle";
      const order = path.phi.map((v, j) => [j, Math.hypot(v[0], v[1])]).sort((a, b) => b[1] - a[1]);
      g.fillStyle = "#fff"; g.strokeStyle = "#000"; const [bx, by] = P(cur); g.beginPath(); g.arc(bx, by, 6, 0, Math.PI * 2); g.fill(); g.stroke();
      for (const [j, mag] of order) {
        const nxt = [cur[0] + path.phi[j][0], cur[1] + path.phi[j][1]], [x0, y0] = P(cur), [x1, y1] = P(nxt);
        g.strokeStyle = "#000"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        const ang = Math.atan2(y1 - y0, x1 - x0); if (mag * cell > 6) { g.fillStyle = "#000"; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 8 * Math.cos(ang - 0.4), y1 - 8 * Math.sin(ang - 0.4)); g.lineTo(x1 - 8 * Math.cos(ang + 0.4), y1 - 8 * Math.sin(ang + 0.4)); g.fill(); }
        if (mag * cell > 14) { const lab = shortName(r.features[j]), tw = g.measureText(lab).width + 6, mx = (x0 + x1) / 2, my = (y0 + y1) / 2; g.fillStyle = "rgba(255,250,240,.9)"; g.fillRect(mx - tw / 2, my - 7, tw, 14); g.fillStyle = "#1f1d18"; g.textAlign = "center"; g.fillText(lab, mx, my); }
        cur = nxt;
      }
      const [fx, fy] = P(path.final); g.fillStyle = "#ffd166"; g.strokeStyle = "#000"; g.beginPath(); g.arc(fx, fy, 7, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  }

  function shownShare() {
    const r = run(); if (!r) return "";
    const on = r.hits.reduce((acc, h, k) => acc + (r.hidden && r.hidden.has(k) ? 0 : h), 0), n = r.side * r.side - (r.hidden ? r.hidden.size : 0);
    return `${n} of ${r.side * r.side} neurons shown, ${(on * 100).toFixed(0)}% of samples in the window`;
  }
  function updateNeuronInfo() { for (const id of ["#neuronInfo", "#neuronInfoVerdict"]) { const el = $(id); if (el) el.textContent = shownShare(); } }
  function fillRunSelects() {
    for (const [id, key] of [["#runA", "runA"], ["#runB", "runB"]]) {
      const sel = $(id); sel.innerHTML = "";
      state.runs.forEach((r, i) => sel.append(Object.assign(document.createElement("option"), { value: i, textContent: `Run ${i + 1}: ${r.features.length} attributes, ${r.side ** 2} neurons` })));
      if (state[key] >= state.runs.length) state[key] = Math.max(0, state.runs.length - 1);
      sel.value = state[key];
    }
    $("#comparePanel").hidden = state.runs.length < 2;
  }

  function wireSomPicks() {
    $("#attrForSom").addEventListener("change", (e) => { e.target.checked ? state.picked.add(state.attr) : state.picked.delete(state.attr); syncPicks(); });
  }

  function wireCompare() {
    for (const [id, key] of [["#runA", "runA"], ["#runB", "runB"]]) $(id).addEventListener("change", (e) => { state[key] = +e.target.value; refresh(); });
    $$("[name=compareMode]").forEach((b) => b.addEventListener("change", (e) => {
      state.compareMode = e.target.value; state.compare = state.compareMode !== "off";
      $("#wipeRow").hidden = state.compareMode !== "wipe"; refresh();
    }));
    $("#wipeRow").hidden = true;
    $("#wipe").addEventListener("input", (e) => { state.wipe = +e.target.value; draw(); });
    $("#swapRuns").addEventListener("click", () => { [state.runA, state.runB] = [state.runB, state.runA]; fillRunSelects(); refresh(); });
  }

  function wireNeuronToggles() {
    for (const [canvasId, allId, noneId] of [["#somGrid", "#neuronsAll", "#neuronsNone"], ["#somGridVerdict", "#neuronsAllV", "#neuronsNoneV"]]) {
      const c = $(canvasId);
      c.style.cursor = "pointer";
      c.addEventListener("click", (e) => {
        const r = run(); if (!r) return;
        const rect = c.getBoundingClientRect(), sx = c.width / rect.width, pad = 10, cell = (c.width - 2 * pad) / r.side;
        const col = Math.floor(((e.clientX - rect.left) * sx - pad) / cell), row = Math.floor(((e.clientY - rect.top) * sx - pad) / cell);
        if (col < 0 || row < 0 || col >= r.side || row >= r.side) return;
        const k = row * r.side + col; r.hidden ??= new Set();
        if (e.shiftKey) {            // shift-click shows only this neuron
          r.hidden = new Set([...Array(r.side * r.side).keys()].filter((q) => q !== k));
        } else r.hidden.has(k) ? r.hidden.delete(k) : r.hidden.add(k);
        updateNeuronInfo(); refresh();
      });
      $(allId).addEventListener("click", () => { const r = run(); if (!r) return; r.hidden = new Set(); updateNeuronInfo(); refresh(); });
      $(noneId).addEventListener("click", () => { const r = run(); if (!r) return; r.hidden = new Set([...Array(r.side * r.side).keys()]); updateNeuronInfo(); refresh(); });
    }
  }

  function drawRedundancy() {
    const r = run(), el = $("#redundancy");
    if (!r) { el.textContent = ""; return; }
    const pairs = [];
    r.features.forEach((a, i) => r.features.forEach((b, j) => { if (j > i && Math.abs(r.corr[i][j]) >= 0.8) pairs.push(`${meta.attributes[a].label} and ${meta.attributes[b].label} (r = ${Math.max(-1, Math.min(1, r.corr[i][j])).toFixed(2)})`); }));
    el.innerHTML = pairs.length ? `<span class="warn">Correlation of 0.8 or more:</span> ${pairs.join("; ")}.` : "No pair of the chosen attributes correlates at 0.8 or more.";
  }

  function drawRunLog() {
    const el = $("#runLog"); el.innerHTML = "";
    if (!state.runs.length) { el.innerHTML = '<p class="small">No runs yet.</p>'; return; }
    state.runs.forEach((r, i) => {
      const b = document.createElement("button"); b.setAttribute("aria-pressed", String(i === state.current));
      const top = r.importance ? r.features.map((f, j) => [f, r.importance[j]]).sort((a, c) => c[1] - a[1]).slice(0, 2).map(([f]) => shortName(f)).join(", ") : "SHAP running";
      b.innerHTML = `Run ${i + 1}: ${r.features.length} attributes, ${r.side * r.side} neurons<small>${r.window.km[0].toFixed(1)}–${r.window.km[1].toFixed(1)} km, ${r.window.t[0].toFixed(2)}–${r.window.t[1].toFixed(2)} s</small><small>${r.features.map(shortName).join(", ")}</small><small>Largest SHAP: ${top}</small>`;
      b.addEventListener("click", () => { state.current = i; state.sample = null; state.explained = null; drawRunLog(); drawRedundancy(); refresh(); });
      el.append(b);
    });
  }

  function drawShapGlobal() {
    const c = $("#shapGlobal"), r = run();
    $("#shapRunLabel").textContent = r ? `Run ${state.current + 1}: ${r.features.length} attributes, ${r.side * r.side} neurons` : "Train a SOM in stage 5 first.";
    if (!r || !r.importance) {
      const g = c.getContext("2d"); g.fillStyle = "#fffaf0"; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = "#5a5446"; g.font = "13px Barlow, Arial, sans-serif"; g.textAlign = "center"; g.fillText(r ? "Computing SHAP values…" : "", c.width / 2, c.height / 2); return;
    }
    const order = r.features.map((f, j) => [f, r.importance[j]]).sort((a, b) => b[1] - a[1]);
    c.height = Math.max(90, 26 + 18 * order.length);
    hbars(c, order.map(([f]) => shortName(f)), order.map(([, v]) => v), { min: 0, max: 0.3, zeroLine: false, colors: order.map(() => "#5a5446"), valueFmt: (v) => v.toFixed(3) });
  }

  function drawShapSample() {
    const r = run(), e = state.explained, local = $("#shapLocal");
    if (!r || !e || e.run !== r.id) {
      $("#sampleTitle").textContent = "Click the section to explain a sample";
      drawSomGrid($("#shapPath"));
      const g = local.getContext("2d"); g.fillStyle = "#fffaf0"; g.fillRect(0, 0, local.width, local.height); return;
    }
    const k = r.bmu[e.index];
    $("#sampleTitle").textContent = `${state.sample.km.toFixed(2)} km, ${state.sample.t.toFixed(2)} s: neuron row ${Math.floor(k / r.side) + 1}, column ${k % r.side + 1}`;
    drawSomGrid($("#shapPath"), e);
    const span = Math.max(r.side - 1, 1), order = e.phi.map((v, j) => [j, Math.hypot(v[0], v[1]) / span]).sort((a, b) => b[1] - a[1]);
    local.height = Math.max(90, 26 + 18 * order.length);
    hbars(local, order.map(([j]) => shortName(r.features[j])), order.map(([, v]) => v), { min: 0, max: 0.4, zeroLine: false, colors: order.map(() => "#be2d28"), valueFmt: (v) => v.toFixed(3), title: "Distance moved, fraction of map width" });
  }

  /* ---------- SOM builder ---------- */
  let worker = null;
  function requestExplain() {
    const r = run(); if (!r || !state.sample || !worker || state.current !== state.runs.length - 1) { if (r && state.current !== state.runs.length - 1) $("#sampleTitle").textContent = "Samples can be explained for the most recent run"; return; }
    const g = meta.grid, gi = Math.round((state.sample.km - g.km_min) / (g.km_max - g.km_min) * (g.nx - 1)), j = Math.min(g.nt - 1, Math.round((state.sample.t - meta.t_min) / g.dt));
    const w = run().window.win; if (gi < w.i0 || gi > w.i1 || j < w.j0 || j > w.j1) { $("#sampleTitle").textContent = "That sample is outside the SOM window"; return; }
    $("#sampleTitle").textContent = "Computing SHAP values for the sample…";
    worker.postMessage({ type: "explain", index: gi * g.nt + j });
  }

  function wireGeology() {
    $$("[data-geo]").forEach((b) => b.addEventListener("click", () => {
      const [k0, k1, t0, t1] = b.dataset.geo.split(",").map(Number);
      // the section stays where it is; only the outlined area of interest moves
      state.geoFocus = { km: [k0, k1], t: [t0, t1], label: b.querySelector("b").textContent };
      $$("[data-geo]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw();
    }));
    $("#geoColumns").addEventListener("change", (e) => { state.showGeoColumns = e.target.checked; draw(); });
    const leg = $("#groupLegend");
    for (const [code, g] of Object.entries(GROUPS)) leg.insertAdjacentHTML("beforeend", `<div class="grp"><span style="background:${g.color}">${code}</span>${g.name}</div>`);
  }

  function wireWellChips() {
    const box = $("#wellChips"), wells = meta.wells || [];
    for (const w of wells) {
      const b = document.createElement("button"); b.textContent = w.name; b.setAttribute("aria-pressed", "true");
      b.style.setProperty("--chip", (WELL_STYLE[w.name] || {}).color || "#fff");
      b.addEventListener("click", () => { state.hiddenWells.has(w.name) ? state.hiddenWells.delete(w.name) : state.hiddenWells.add(w.name); b.setAttribute("aria-pressed", String(!state.hiddenWells.has(w.name))); draw(); });
      box.append(b);
    }
    const n = document.createElement("button"); n.textContent = "Formation names"; n.setAttribute("aria-pressed", "true");
    n.addEventListener("click", () => { state.showNames = !state.showNames; n.setAttribute("aria-pressed", String(state.showNames)); draw(); });
    box.append(n);
  }

  function attrLists() { return $$(".attr-picks"); }
  function syncPicks() {
    for (const box of attrLists()) box.querySelectorAll("input").forEach((i) => (i.checked = state.picked.has(i.value)));
    const labels = [...state.picked].map((f) => meta.attributes[f].label);
    for (const id of ["#somPicks", "#somPicks2", "#somPicks2b"]) { const el = $(id); if (el) el.textContent = labels.length ? labels.join(", ") : "none yet"; }
    const box = $("#attrForSom"); if (box) box.checked = state.picked.has(state.attr);
    for (const id of ["#pickCount", "#pickCount2"]) { const el = $(id); if (el) el.textContent = `${state.picked.size} chosen`; }
  }

  function buildAttrList(box) {
    const groups = {};
    for (const [k, a] of Object.entries(meta.attributes)) (groups[a.family] ??= []).push([k, a]);
    for (const [fam, list] of Object.entries(groups)) {
      box.append(Object.assign(document.createElement("div"), { className: "fam", textContent: fam }));
      for (const [k, a] of list) {
        const l = document.createElement("label");
        l.innerHTML = `<input type="checkbox" value="${k}"> ${a.label}`;
        l.querySelector("input").addEventListener("change", (e) => { e.target.checked ? state.picked.add(k) : state.picked.delete(k); syncPicks(); });
        box.append(l);
      }
    }
  }

  async function startRun(button) {
    const feats = [...state.picked];
    const prog = button.closest(".card").querySelector(".progress") || $("#progress");
    const bar = prog.querySelector(".bar span"), text = prog.querySelector("p");
    if (feats.length < 2) { prog.hidden = false; text.textContent = "Choose at least two attributes."; return; }
    const side = state.neurons, g = meta.grid;
    const kmRange = { study: [ZOOMS.study[0], ZOOMS.study[1]], full: [meta.km_min, meta.km_max], someren: ZOOMS.someren, well: ZOOMS.well, view: [view().kmA, view().kmB] }[state.somArea];
    if (state.somArea === "view") { state.somT = [view().tA, view().tB]; $("#somTop").value = view().tA.toFixed(2); $("#somBase").value = view().tB.toFixed(2); }
    let [tTop, tBase] = state.somT; if (tBase <= tTop + 0.1) tBase = tTop + 0.1;
    const tEnd = Math.min(...feats.map((f) => meta.t_min + lastJ(f) * g.dt));   // DQ attributes end at 2.0 s
    if (tBase > tEnd) { tBase = tEnd; state.somT[1] = tEnd; $("#somBase").value = tEnd.toFixed(2); $("#windowText").textContent = windowText(); }
    const toI = (k) => Math.max(0, Math.min(g.nx - 1, Math.round((k - g.km_min) / (g.km_max - g.km_min) * (g.nx - 1))));
    const toJ = (t) => Math.max(0, Math.min(g.nt - 1, Math.round((t - meta.t_min) / g.dt)));
    const win = { i0: toI(kmRange[0]), i1: toI(kmRange[1]), j0: toJ(tTop), j1: toJ(tBase) };
    $$(".run").forEach((b) => (b.disabled = true)); state.busy = true; prog.hidden = false; text.textContent = "Loading attributes";
    const attrs = [];
    for (const f of feats) { const d = await loadBin(`attr_${f}.bin`, Uint8Array); attrs.push({ key: f, data: d.slice(), min: meta.attributes[f].min, max: meta.attributes[f].max }); }
    worker?.terminate(); worker = new Worker("js/som-worker.js");
    const rec = { id: Date.now(), features: feats, side, bmu: null, hits: null, corr: null, importance: null,
      window: { km: [Math.max(kmRange[0], meta.km_min), Math.min(kmRange[1], meta.km_max)], t: [tTop, tBase], win } };
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "progress") { bar.style.width = `${Math.round(m.frac * 100)}%`; text.textContent = m.stage; }
      if (m.type === "map") {
        Object.assign(rec, { bmu: m.bmu, hits: m.hits, corr: m.corr }); state.runs.push(rec); state.current = state.runs.length - 1;
        state.sample = null; state.explained = null; $$(".run").forEach((b) => (b.disabled = false)); state.busy = false;
        drawRunLog(); drawRedundancy(); $(".notes").scrollTop = 0;   // bring the controls back into view after a run
        if (state.runs.length >= 2) { state.runB = state.runs.length - 1; state.runA = state.runs.length - 2; }
        fillRunSelects(); refresh();
      }
      if (m.type === "importance") { rec.importance = m.importance; prog.hidden = true; drawRunLog(); drawShapGlobal(); }
      if (m.type === "explain") { state.explained = { run: rec.id, ...m }; drawShapSample(); }
    };
    worker.postMessage({ type: "run", attrs, nx: meta.grid.nx, nt: meta.grid.nt, side, seed: 7, win }, attrs.map((a) => a.data.buffer));
  }

  function windowText() {
    const k = { study: ZOOMS.study, full: [meta.km_min, meta.km_max], someren: ZOOMS.someren, well: ZOOMS.well, view: [view().kmA, view().kmB] }[state.somArea];
    return `${k[0].toFixed(1)}–${k[1].toFixed(1)} km, ${state.somT[0].toFixed(2)}–${state.somT[1].toFixed(2)} s`;
  }

  function wireBuilder() {
    attrLists().forEach(buildAttrList);
    $$(".neurons").forEach((sel) => { sel.value = state.neurons; sel.addEventListener("change", (e) => { state.neurons = +e.target.value; $$(".neurons").forEach((x) => (x.value = state.neurons)); }); });
    $("#somArea").addEventListener("change", (e) => { state.somArea = e.target.value; $("#windowText").textContent = windowText(); });
    for (const [id, i] of [["#somTop", 0], ["#somBase", 1]]) $(id).addEventListener("change", (e) => { state.somT[i] = +e.target.value; $("#windowText").textContent = windowText(); });
    $$(".run").forEach((b) => b.addEventListener("click", () => startRun(b)));
    syncPicks(); $("#windowText").textContent = windowText();
  }

  function wire() {
    const aSel = $("#attrSelect"), groups = {};
    for (const [k, a] of Object.entries(meta.attributes)) (groups[a.family] ??= []).push([k, a]);
    for (const [fam, list] of Object.entries(groups)) {
      const og = document.createElement("optgroup"); og.label = fam;
      for (const [k, a] of list) og.append(Object.assign(document.createElement("option"), { value: k, textContent: a.label }));
      aSel.append(og);
    }
    aSel.value = state.attr; aSel.addEventListener("change", () => { state.attr = aSel.value; drawColorbar(); syncPicks(); refresh(); });
    const lSel = $("#attrLut");
    lSel.append(Object.assign(document.createElement("option"), { value: "default", textContent: "Default for this attribute" }));
    for (const [k, v] of Object.entries(meta.luts)) lSel.append(Object.assign(document.createElement("option"), { value: k, textContent: v.label }));
    lSel.addEventListener("change", () => { state.attrLut = lSel.value; drawColorbar(); refresh(); });
    const sSel = $("#seisMap");
    for (const [k, v] of Object.entries(SEIS_MAPS)) sSel.append(Object.assign(document.createElement("option"), { value: k, textContent: v.label }));
    sSel.addEventListener("change", () => { state.seisMap = sSel.value; baseImg = raster(meta.section.nx, meta.nt, grayAt); draw(); });

    $$(".tag").forEach((b) => b.addEventListener("click", () => setStage(+b.dataset.stage)));
    $$("[data-zoom]").forEach((b) => b.addEventListener("click", () => { setZoom(b.dataset.zoom); draw(); }));
    for (const [id, key] of [["#showWell", "showWell"], ["#showUnits", "showUnits"]]) $(id).addEventListener("change", (e) => { state[key] = e.target.checked; draw(); });
    const hBoxes = [$("#showHorizons"), ...$$(".syncHorizons")];
    hBoxes.forEach((box) => box.addEventListener("change", (e) => { state.showHorizons = e.target.checked; hBoxes.forEach((b) => (b.checked = state.showHorizons)); draw(); }));
    $("#hideWellControl").addEventListener("click", (e) => {
      state.hideControl = !state.hideControl; e.target.setAttribute("aria-pressed", String(state.hideControl));
      e.target.textContent = state.hideControl ? "Show well control" : "Hide all well control"; draw();
    });
    for (const [id, key] of [["#attrOpacity", "attrOpacity"], ["#somOpacity", "somOpacity"], ["#somOpacity2", "somOpacity"], ["#verdictOpacity", "verdictOpacity"]])
      $(id).addEventListener("input", (e) => { state[key] = +e.target.value; $$("#somOpacity, #somOpacity2").forEach((x) => (x.value = state.somOpacity)); draw(); });

    const idle = "Drag a box on the section to zoom. Move over it to read values.";
    cv.addEventListener("mousemove", (e) => {
      const r = cv.getBoundingClientRect(), km = invX(e.clientX - r.left), t = invY(e.clientY - r.top), v = view();
      if (km < v.kmA || km > v.kmB || t < meta.t_min || t > meta.t_max) { $("#readout").textContent = idle; return; }
      const g = meta.grid, gi = Math.round((km - g.km_min) / (g.km_max - g.km_min) * (g.nx - 1)), j = Math.min(g.nt - 1, Math.round((t - meta.t_min) / g.dt));
      let txt = `${km.toFixed(2)} km, ${t.toFixed(3)} s`;
      const attr = cache[`attr_${state.attr}.bin`], rr = run();
      if (state.stage === 3 && attr && gi >= 0 && gi < g.nx && j <= lastJ(state.attr)) { const a = meta.attributes[state.attr]; txt += `, ${a.label} ${fmt(a.min + attr[gi * g.nt + j] / 255 * (a.max - a.min))} ${a.unit}`; }
      const qa = cache[`attr_${state.qi.x}.bin`];
      if (state.stage === 8 && state.qi.mode === "log" && qa && gi >= 0 && gi < g.nx && j <= lastJ(state.qi.x)) { const a = meta.attributes[state.qi.x]; txt += `, ${a.label} ${fmt(a.min + qa[gi * g.nt + j] / 255 * (a.max - a.min))} ${a.unit}`; }
      if (isSom(state.stage) && rr && gi >= 0 && gi < g.nx && rr.bmu[gi * g.nt + j] !== 255) { const k = rr.bmu[gi * g.nt + j]; txt += `, neuron row ${Math.floor(k / rr.side) + 1}, column ${k % rr.side + 1}`; }
      $("#readout").textContent = txt;
    });
    // a click keeps its stage action; a drag of more than 6 px draws a box and zooms to it
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("mousedown", (e) => { const [x, y] = pos(e); state.drag = { x0: x, y0: y, x1: x, y1: y, moved: false }; });
    window.addEventListener("mousemove", (e) => {
      const d = state.drag; if (!d) return; const [x, y] = pos(e);
      d.x1 = Math.max(MARGIN.l, Math.min(W - MARGIN.r, x)); d.y1 = Math.max(MARGIN.t, Math.min(H - MARGIN.b, y));
      if (Math.hypot(d.x1 - d.x0, d.y1 - d.y0) > 6) { d.moved = true; draw(); }
    });
    window.addEventListener("mouseup", (e) => {
      const d = state.drag; state.drag = null; if (!d) return;
      if (d.moved) {
        const kA = invX(Math.min(d.x0, d.x1)), kB = invX(Math.max(d.x0, d.x1)), tA = invY(Math.min(d.y0, d.y1)), tB = invY(Math.max(d.y0, d.y1));
        if (kB - kA > 0.2 && tB - tA > 0.03) {
          ZOOMS.custom = [Math.max(meta.km_min, kA), Math.min(meta.km_max, kB)]; setZoom("custom");
          state.zoomT = [Math.max(meta.t_min, tA), Math.min(meta.t_max, tB)]; $('[data-zoom="custom"]').disabled = false;
        }
        draw(); return;
      }
      if (e.target !== cv) return;
      const [x, y] = pos(e), km = invX(x), t = invY(y), v = view();
      if (km < v.kmA || km > v.kmB || t < v.tA || t > v.tB) return;
      if (state.explore.picking) return addPickPoint(km, t);
      if (state.stage === 1 && PICK_MODE) return pickAt(km, t, e.shiftKey);
      if (state.stage === 5 && run()) { state.sample = { km, t }; requestExplain(); draw(); }
    });

    const gl = $("#glossary");
    document.addEventListener("click", (e) => {
      const t = e.target.closest(".term");
      if (t) {
        const [title, text] = GLOSSARY[t.dataset.term]; $("#glossTitle").textContent = title; $("#glossText").textContent = text; gl.hidden = false;
        const r = t.getBoundingClientRect(); gl.style.left = Math.max(8, Math.min(window.innerWidth - 340, r.left)) + "px"; gl.style.top = Math.max(8, Math.min(window.innerHeight - gl.offsetHeight - 10, r.bottom + 6)) + "px";
      } else if (e.target.closest(".close") || !e.target.closest(".glossary")) gl.hidden = true;
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") gl.hidden = true; });
    new ResizeObserver(resize).observe($(".canvaswrap"));
  }


  /* ---------- unfilled DQ wiggle traces over a DQ attribute ---------- */
  let dqWiggle = null;
  const wigglesOn = () => state.wiggles && ((state.stage === 3 && isDq(state.attr)) || (state.stage === 8 && state.qi.mode === "log" && isDq(state.qi.x)));
  async function loadWiggle() {
    const w = meta.dq_wiggle, d = await loadBin(w.file, Uint8Array), v = new Float32Array(d.length), sc = (w.max - w.min) / 255;
    for (let i = 0; i < d.length; i++) v[i] = w.min + d[i] * sc;
    dqWiggle = v;
  }
  // Traces are spaced at least wigglePx pixels apart, and the deflection is scaled to the fixed DQ color range
  // (a value of 280 moves the trace by the gain times one trace spacing), so it does not change with the view.
  function drawWiggles() {
    const v = dqWiggle, w = meta.dq_wiggle; if (!v) return;
    const vw = view(), kmStep = (meta.grid.km_max - meta.grid.km_min) / (w.nx - 1), pxPerTrace = (W - MARGIN.l - MARGIN.r) / ((vw.kmB - vw.kmA) / kmStep);
    const step = Math.max(1, Math.ceil(state.wigglePx / pxPerTrace)), spacing = step * pxPerTrace, amp = spacing * state.wiggleGain / w.max;
    const gi = (km) => Math.round((km - meta.grid.km_min) / kmStep), gj = (t) => Math.max(0, Math.min(w.nt - 1, Math.round((t - w.t_min) / w.dt)));
    const i0 = Math.max(0, gi(vw.kmA) - step), i1 = Math.min(w.nx - 1, gi(vw.kmB) + step), j0 = gj(Math.max(vw.tA, w.t_min)), j1 = gj(vw.tB);
    const jStep = Math.max(1, Math.floor((j1 - j0) / (H - MARGIN.t - MARGIN.b)));
    cx.save(); clipPlot(); cx.lineWidth = 0.9; cx.strokeStyle = "#000"; cx.lineJoin = "round";
    for (let i = Math.floor(i0 / step) * step; i <= i1; i += step) {
      const x0 = X(meta.grid.km_min + i * kmStep); cx.beginPath();
      for (let j = j0; j <= j1; j += jStep) {   // deflection limited to one trace spacing, so values beyond the color range do not cross the neighboring traces
        const x = x0 + Math.max(-spacing, Math.min(spacing, v[i * w.nt + j] * amp)), y = Y(w.t_min + j * w.dt); j === j0 ? cx.moveTo(x, y) : cx.lineTo(x, y); }
      cx.stroke();
    }
    cx.restore();
    $$(".wiggleSpacing").forEach((el) => (el.textContent = `One wiggle every ${step * 20} m at this zoom.`));
  }
  function wireWiggles() {
    $$(".wiggleToggle").forEach((b) => b.addEventListener("change", (e) => { state.wiggles = e.target.checked; $$(".wiggleToggle").forEach((x) => (x.checked = state.wiggles)); refresh(); }));
    $("#wiggleGain").addEventListener("input", (e) => { state.wiggleGain = +e.target.value; draw(); });
    $("#wigglePx").addEventListener("input", (e) => { state.wigglePx = +e.target.value; draw(); });
  }

  /* ---------- logs and crossplots (internal stage 8, shown fourth) ---------- */
  let logs = null, qiPts = [], qiMaskInfo = null, qiBusy = false;
  const QI_WINDOWS = [4, 8, 16, 24, 40, 62];
  const XP = { l: 64, r: 18, t: 44, b: 46 };
  const winMs = () => QI_WINDOWS[state.qi.win];
  const qw = () => logs.wells.find((w) => w.name === state.qi.well);
  const gridT = (j) => meta.t_min + j * meta.grid.dt;
  const sh = () => state.qi.shift / 1000;   // tie shift: logs and tops moved down (positive) or up against the seismic, in s
  const unitAt = (w, t) => w.units.find((u) => t - sh() >= u.top_twt && t - sh() < u.base_twt) || null;
  const unitShort = (n) => n.replace(" Formation", " Fm").replace(" Member", " Mbr").replace(" (undifferentiated)", "");
  // groups of adjacent units offered as one interval: [label, top unit, base unit]
  const PACKAGES = { "ASTEN-GT-02": [["Someren Mbr to Boom Mbr", "Someren Member", "Boom Member"]], "CAL-GT-04": [["Epen Fm to Zeeland Fm", "Epen Formation", "Zeeland Formation"]] };
  function intervalOf(w, sel) {   // time range of the chosen interval, or null for the whole logged interval
    if (sel === "all") return null;
    if (sel.startsWith("pkg:")) {
      const p = (PACKAGES[w.name] || [])[+sel.slice(4)]; if (!p) return null;
      const a = w.units.find((u) => u.name === p[1]), b = w.units.find((u) => u.name === p[2]);
      return a && b ? { top: a.top_twt + sh(), base: b.base_twt + sh(), label: p[0] } : null;
    }
    const u = w.units.find((v) => v.name === sel); return u ? { top: u.top_twt + sh(), base: u.base_twt + sh(), label: unitShort(u.name) } : null;
  }
  const CLASS_COLORS = ["#e9b949", "#2f5d62"];   // gamma ray below the cutoff, at or above it
  // two groups of formations from the well tops, for wells where the interval of interest has no gamma ray
  const FM_CLASSES = { "CAL-GT-04": { labels: ["Landen Clay to Swalmen members", "Houthem and Maastricht formations"],
    groups: [["Landen Clay Member", "Gelinden Member", "Heers Member", "Swalmen Member"], ["Houthem Formation", "Maastricht Formation"]], colors: ["#8ab17d", "#c77dff"] } };
  const classKind = () => { const k = state.qi.mode === "log" ? state.qi.color : state.qi.colorLog; return k === "class" ? "gr" : k === "fmclass" ? "fm" : null; };
  const classOn = () => classKind() != null;
  const classColors = () => (classKind() === "fm" ? FM_CLASSES[state.qi.well].colors : CLASS_COLORS);
  const fmY = (w) => (w.curves.DRILL ? "DRILL" : "GR");   // a log present over the whole grouped interval
  const cutNow = () => state.qi.cuts[state.qi.well];
  const lutColor = (lut, u) => lut[Math.max(0, Math.min(255, Math.round(u * 255)))];
  const CURVE_COLOR = { GR: "#2a9d8f", PHID: "#c8362d", NPHI: "#3a6ea5", RHOB: "#6d597a", TEMP: "#e76f51", DRILL: "#8d6e63" };

  function blockedCurve(w, key) {   // the log averaged over the chosen window at each 4 ms attribute sample along the well
    const id = `${w.name}:${key}:${winMs()}:${state.qi.shift}`; blockedCurve.c ??= {};
    if (blockedCurve.c[id]) return blockedCurve.c[id];
    const c = w.curves[key]; if (!c) return null;
    const v = c.values, n = v.length, m = winMs();
    const out = w.grid.j.map((j) => {
      const t = gridT(j) - sh(), k0 = Math.round((t - m / 2000 - w.t0) / w.dt);
      let s = 0, cnt = 0;
      for (let k = Math.max(0, k0); k < Math.min(n, k0 + m); k++) if (v[k] != null) { s += v[k]; cnt++; }
      return cnt >= Math.max(2, m / 2) ? s / cnt : null;
    });
    return (blockedCurve.c[id] = out);
  }

  function fitLine(pts, key) {    // least-squares straight line of pts[key] against two-way time
    const n = pts.length, mt = pts.reduce((a, p) => a + p.t, 0) / n, mv = pts.reduce((a, p) => a + p[key], 0) / n;
    let sxy = 0, sxx = 0; for (const p of pts) { sxy += (p.t - mt) * (p[key] - mv); sxx += (p.t - mt) ** 2; }
    const b = sxx ? sxy / sxx : 0; return (t) => mv + b * (t - mt);
  }
  function corr(pts, a = "x", b = "y") {
    const n = pts.length; if (n < 5) return null;
    const ma = pts.reduce((s, p) => s + p[a], 0) / n, mb = pts.reduce((s, p) => s + p[b], 0) / n;
    let sab = 0, saa = 0, sbb = 0; for (const p of pts) { const da = p[a] - ma, db = p[b] - mb; sab += da * db; saa += da * da; sbb += db * db; }
    return saa && sbb ? sab / Math.sqrt(saa * sbb) : null;
  }

  // samples along the well for the current settings; xKey replaces the horizontal-axis attribute (used for the bars)
  function qiSamples(xKey = state.qi.x, q = state.qi) {
    const w = qw(), g = w.grid, xs = g.attrs[xKey];
    const ys = q.mode === "log" ? blockedCurve(w, q.y) : g.attrs[q.y2];
    const cKey = q.mode === "attr" ? q.colorLog : q.color, byClass = cKey === "class", fm = cKey === "fmclass" ? FM_CLASSES[w.name] : null;
    const cs = byClass ? blockedCurve(w, "GR") : w.curves[cKey] ? blockedCurve(w, cKey) : null, cut = q.cuts[w.name], iv = intervalOf(w, q.unit);
    const out = [];
    g.j.forEach((j, k) => {
      const t = gridT(j), u = unitAt(w, t);
      if (iv && (t < iv.top || t >= iv.base)) return;
      const x = xs[k], y = ys ? ys[k] : null, c = cs ? cs[k] : null;
      if (x == null || y == null) return;
      if (cKey === "fmclass" && !fm) return;
      const gi = fm ? fm.groups.findIndex((gr) => u && gr.includes(u.name)) : -1;
      if (fm && gi < 0) return;
      if (((q.mode === "attr" && !fm) || byClass) && c == null) return;
      out.push({ k, j, t, km: g.km[k], x, y, x0: x, y0: y, c, u, cls: byClass ? (c >= cut ? 1 : 0) : fm ? gi : null });
    });
    if (q.mode === "log" && q.detrend && out.length > 2) {
      for (const key of ["x", "y"]) { const f = fitLine(out, key); out.forEach((p) => (p[key] -= f(p.t))); }
    }
    return out;
  }

  function axisRange(kind, key) {  // fixed for each quantity; with the trend removed, a symmetric range half the full span
    const r = kind === "attr" ? [meta.attributes[key].min, meta.attributes[key].max] : [qw().curves[key].min, qw().curves[key].max];
    if (state.qi.mode === "log" && state.qi.detrend) { const h = (r[1] - r[0]) / 2; return [-h, h]; }
    return r;
  }

  function sizeCanvas(c) {
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; if (!r.width) return null;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w: r.width, h: r.height };
  }

  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  /* density of attribute combinations along the line in the study window, for the two-attribute crossplot */
  async function qiDensity() {
    const q = state.qi, id = `${q.x}:${q.y2}`; qiDensity.c ??= {};
    if (qiDensity.c[id]) return qiDensity.c[id];
    const dx = await loadBin(`attr_${q.x}.bin`, Uint8Array), dy = await loadBin(`attr_${q.y2}.bin`, Uint8Array);
    const g = meta.grid, nt = g.nt, B = 64, h = new Float32Array(B * B);
    const i1 = Math.round((ZOOMS.study[1] - g.km_min) / (g.km_max - g.km_min) * (g.nx - 1)), j1 = Math.min(Math.round((STUDY_T[1] - meta.t_min) / g.dt), lastJ(q.x), lastJ(q.y2));
    for (let i = 0; i <= i1; i++) for (let j = 0; j <= j1; j++) { const idx = i * nt + j; h[(dx[idx] >> 2) * B + (63 - (dy[idx] >> 2))]++; }
    const mx = Math.log1p(Math.max(...h)), c = makeCanvas(B, B), ctx = c.getContext("2d"), img = ctx.createImageData(B, B);
    for (let a = 0; a < B; a++) for (let b = 0; b < B; b++) {
      const v = h[a * B + b], p = (b * B + a) * 4, s = v ? Math.log1p(v) / mx : 0;
      img.data[p] = img.data[p + 1] = img.data[p + 2] = Math.round(240 - 150 * s); img.data[p + 3] = v ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0); return (qiDensity.c[id] = c);
  }

  /* samples along the whole line inside the polygon, as a section overlay */
  async function qiMask() {
    const q = state.qi, ax = meta.attributes[q.x], ay = meta.attributes[q.y2], lut = new Uint8Array(65536);
    for (let a = 0; a < 256; a++) { const xv = ax.min + a / 255 * (ax.max - ax.min); for (let b = 0; b < 256; b++) lut[a * 256 + b] = inPoly(xv, ay.min + b / 255 * (ay.max - ay.min), q.poly) ? 1 : 0; }
    const dx = await loadBin(`attr_${q.x}.bin`, Uint8Array), dy = await loadBin(`attr_${q.y2}.bin`, Uint8Array);
    const g = meta.grid, nt = g.nt, c = makeCanvas(g.nx, nt), ctx = c.getContext("2d"), img = ctx.createImageData(g.nx, nt);
    const i1 = Math.round((ZOOMS.study[1] - g.km_min) / (g.km_max - g.km_min) * (g.nx - 1)), j1 = Math.round((STUDY_T[1] - meta.t_min) / g.dt);
    let nIn = 0, nAll = 0; const jm = Math.min(lastJ(q.x), lastJ(q.y2));
    for (let i = 0; i < g.nx; i++) for (let j = 0; j <= jm; j++) {
      const idx = i * nt + j, hit = lut[dx[idx] * 256 + dy[idx]];
      if (i <= i1 && j <= j1) { nAll++; nIn += hit; }
      if (hit) { const p = (j * g.nx + i) * 4; img.data[p] = 255; img.data[p + 1] = 209; img.data[p + 2] = 102; img.data[p + 3] = 255; }
    }
    ctx.putImageData(img, 0, 0);
    qiMaskInfo = { share: nIn / nAll };
    return { img: c, km: [g.km_min, g.km_max], t: [meta.t_min - g.dt / 2, meta.t_min + (nt - 0.5) * g.dt] };
  }

  function qiOverlayKey() {
    const q = state.qi;
    if (q.mode === "log") return `q:a:${q.x}`;
    return q.closed ? `q:p:${q.x}:${q.y2}:${q.version}` : "";
  }
  async function qiOverlay() {
    const q = state.qi, g = meta.grid, nt = g.nt;
    if (q.mode === "log") {
      await loadBin(`attr_${q.x}.bin`, Uint8Array);
      return { img: attrRaster(q.x, meta.attributes[q.x].lut), km: [g.km_min, g.km_max], t: [meta.t_min - g.dt / 2, meta.t_min + (nt - 0.5) * g.dt] };
    }
    return qiMask();
  }

  /* ---------- the crossplot ---------- */
  async function drawXplot() {
    const c = $("#xplot"), s = sizeCanvas(c); if (!s) return;
    const { g, w, h } = s, q = state.qi, well = qw();
    const pts = qiSamples(), xr = axisRange("attr", q.x), yr = q.mode === "log" ? axisRange("log", q.y) : axisRange("attr", q.y2);
    const PX = (v) => XP.l + (v - xr[0]) / (xr[1] - xr[0]) * (w - XP.l - XP.r), PY = (v) => h - XP.b - (v - yr[0]) / (yr[1] - yr[0]) * (h - XP.t - XP.b);
    g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.rect(XP.l, XP.t, w - XP.l - XP.r, h - XP.t - XP.b); g.clip();
    if (q.mode === "attr") { const d = await qiDensity(); g.imageSmoothingEnabled = false; g.drawImage(d, XP.l, XP.t, w - XP.l - XP.r, h - XP.t - XP.b); }
    // grid
    g.strokeStyle = "#e3d9bd"; g.lineWidth = 1;
    const xs = niceStep(xr[1] - xr[0], 6), ys = niceStep(yr[1] - yr[0], 6);
    for (let v = Math.ceil(xr[0] / xs) * xs; v <= xr[1] + 1e-9; v += xs) { g.beginPath(); g.moveTo(PX(v), XP.t); g.lineTo(PX(v), h - XP.b); g.stroke(); }
    for (let v = Math.ceil(yr[0] / ys) * ys; v <= yr[1] + 1e-9; v += ys) { g.beginPath(); g.moveTo(XP.l, PY(v)); g.lineTo(w - XP.r, PY(v)); g.stroke(); }
    // points
    const cKey = q.mode === "attr" ? q.colorLog : q.color, curve = well.curves[cKey], vir = meta.luts.viridis.lut;
    const tRange = [well.t0, well.t0 + well.n * well.dt];
    const colorOf = (p) => {
      if (p.cls != null) return classColors()[p.cls];
      if (q.mode === "log" && q.color === "unit") return p.u ? p.u.color : "#999";
      if (q.mode === "log" && q.color === "twt") return `rgb(${lutColor(vir, (p.t - tRange[0]) / (tRange[1] - tRange[0]))})`;
      return p.c == null ? "#bbb" : `rgb(${lutColor(vir, (p.c - curve.min) / (curve.max - curve.min))})`;
    };
    qiPts = pts.map((p) => ({ ...p, px: PX(p.x), py: PY(p.y) }));
    const lit = q.mode === "attr" && q.closed;
    for (const p of qiPts) {
      g.beginPath(); g.arc(p.px, p.py, 4.2, 0, Math.PI * 2); g.fillStyle = colorOf(p); g.fill();
      const inside = lit && inPoly(p.x, p.y, q.poly);
      g.lineWidth = inside ? 2.2 : 0.7; g.strokeStyle = inside ? "#b8860b" : "rgba(20,20,20,.55)"; g.stroke();
    }
    const r = corr(pts);
    if (q.mode === "log" && r != null) {     // least-squares line of y on x
      const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
      let sxy = 0, sxx = 0; for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; }
      const b = sxy / sxx; g.setLineDash([7, 5]); g.strokeStyle = "#1f1d18"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(PX(xr[0]), PY(my + b * (xr[0] - mx))); g.lineTo(PX(xr[1]), PY(my + b * (xr[1] - mx))); g.stroke(); g.setLineDash([]);
    }
    // polygon
    if (q.mode === "attr" && q.poly.length) {
      g.strokeStyle = "#000"; g.lineWidth = 3.5; g.beginPath(); q.poly.forEach(([a, b], i) => (i ? g.lineTo : g.moveTo).call(g, PX(a), PY(b))); if (q.closed) g.closePath(); g.stroke();
      g.strokeStyle = "#ffd166"; g.lineWidth = 2; g.stroke();
      if (q.closed) { g.fillStyle = "rgba(255,209,102,.18)"; g.fill(); }
      for (const [a, b] of q.poly) { g.fillStyle = "#ffd166"; g.strokeStyle = "#000"; g.lineWidth = 1; g.beginPath(); g.arc(PX(a), PY(b), 4, 0, Math.PI * 2); g.fill(); g.stroke(); }
    }
    // hovered sample
    if (q.hover && q.hover.well === well.name) {
      const p = qiPts.find((x) => x.j === q.hover.j);
      if (p) { g.lineWidth = 3; g.strokeStyle = "#000"; g.beginPath(); g.arc(p.px, p.py, 9, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1.8; g.strokeStyle = "#e63946"; g.stroke(); }
    }
    g.restore();
    // axes
    g.strokeStyle = "#5a5446"; g.lineWidth = 1; g.strokeRect(XP.l, XP.t, w - XP.l - XP.r, h - XP.t - XP.b);
    g.fillStyle = "#1f1d18"; g.font = "12px Barlow, Arial, sans-serif";
    g.textAlign = "center"; g.textBaseline = "top";
    for (let v = Math.ceil(xr[0] / xs) * xs; v <= xr[1] + 1e-9; v += xs) g.fillText(fmt(v), PX(v), h - XP.b + 5);
    g.textAlign = "right"; g.textBaseline = "middle";
    for (let v = Math.ceil(yr[0] / ys) * ys; v <= yr[1] + 1e-9; v += ys) g.fillText(fmt(v), XP.l - 6, PY(v));
    const res = q.mode === "log" && q.detrend ? " after the trend with time" : "";
    const A = meta.attributes[q.x];
    g.font = "600 12.5px Barlow, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "bottom";
    g.fillText(`${A.label} (${A.unit})${res}`, (XP.l + w - XP.r) / 2, h - 6);
    const yl = q.mode === "log" ? `${well.curves[q.y].label} (${well.curves[q.y].unit})${res}` : `${meta.attributes[q.y2].label} (${meta.attributes[q.y2].unit})`;
    g.save(); g.translate(14, (XP.t + h - XP.b) / 2); g.rotate(-Math.PI / 2); g.textBaseline = "middle"; g.fillText(yl, 0, 0); g.restore();
    // n, r and the color key
    g.textAlign = "left"; g.textBaseline = "middle"; g.font = "700 13px Barlow, Arial, sans-serif";
    const iv = intervalOf(well, q.unit), where = iv ? iv.label : "logged interval";
    const rTxt = r == null ? "r not computed for fewer than 5 samples" : `r = ${r.toFixed(2)}`;
    g.fillText(`${well.name}, ${where}: n = ${pts.length}, ${rTxt}${q.mode === "attr" && r != null ? " between the two attributes" : ""}`, 8, 12);
    if (classOn()) {   // class key
      const n1 = pts.filter((p) => p.cls === 1).length, fmL = classKind() === "fm" ? FM_CLASSES[well.name].labels : null;
      const lab = fmL ? [`${fmL[0]} (${pts.length - n1})`, `${fmL[1]} (${n1})`] : [`Gamma ray below ${cutNow()} API (${pts.length - n1})`, `${cutNow()} API or more (${n1})`];
      g.font = "11.5px Barlow, Arial, sans-serif"; g.textBaseline = "middle"; g.textAlign = "left";
      let xx = w - XP.r - lab.reduce((a, l) => a + g.measureText(l).width + 26, 0);
      lab.forEach((l, i) => { g.fillStyle = classColors()[i]; g.beginPath(); g.arc(xx + 5, 31, 5, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#1f1d18"; g.lineWidth = 0.7; g.stroke();
        g.fillStyle = "#1f1d18"; g.fillText(l, xx + 13, 31); xx += g.measureText(l).width + 26; });
    } else if (!(q.mode === "log" && q.color === "unit")) {
      const bw = 110, x0 = w - XP.r - bw - 34, y0 = 27;
      for (let i = 0; i < bw; i++) { g.fillStyle = `rgb(${lutColor(vir, i / (bw - 1))})`; g.fillRect(x0 + i, y0, 1.5, 8); }
      g.font = "11px Barlow, Arial, sans-serif"; g.fillStyle = "#1f1d18"; g.textBaseline = "middle";
      const lab = q.mode === "log" && q.color === "twt" ? ["Color: two-way time", tRange[0].toFixed(2), tRange[1].toFixed(2) + " s"] : [`Color: ${curve.label.toLowerCase()}`, fmt(curve.min), `${fmt(curve.max)} ${curve.unit}`];
      g.textAlign = "right"; g.fillText(lab[1], x0 - 3, y0 + 4); g.fillText(lab[0], x0 - 3 - g.measureText(lab[1]).width - 8, y0 + 4);
      g.textAlign = "left"; g.fillText(lab[2], x0 + bw + 3, y0 + 4);
    }
    if (!pts.length) { g.textAlign = "center"; g.textBaseline = "middle"; g.font = "13px Barlow, Arial, sans-serif"; g.fillStyle = "#5a5446";
      g.fillText(`No ${q.mode === "log" ? well.curves[q.y].label.toLowerCase() : well.curves[q.colorLog].label.toLowerCase()} samples in this interval at ${well.name}`, (XP.l + w - XP.r) / 2, (XP.t + h - XP.b) / 2); }
    xplotGeom = { PX, PY, xr, yr, w, h };
  }
  let xplotGeom = null;

  /* ---------- the well panel ---------- */
  function wellTracks(well) {
    const q = state.qi, tr = [{ type: "units", w: 0.9 }, { type: "curve", keys: ["GR"] }];
    if (well.curves.PHID) tr.push({ type: "curve", keys: ["PHID", "NPHI"] });
    if (well.curves.DRILL) tr.push({ type: "curve", keys: ["DRILL"] });
    if (q.mode === "log" && isDq(q.x)) {   // DQ at 2 ms beside the logs, and relative acoustic impedance for comparison
      tr.push({ type: "dqwig", w: 1.4 }, { type: "attr", key: "relative_acoustic_impedance" });
      if (q.x !== "dq") tr.push({ type: "attr", key: q.x });
      return tr;
    }
    tr.push({ type: "curve", keys: ["TEMP"] }, { type: "attr", key: q.x });
    if (q.mode === "attr") tr.push({ type: "attr", key: q.y2 });
    return tr;
  }
  /* DQ at 2 ms along the well as an unfilled wiggle, with the log porosity drawn over it on a fixed scale, and the
     correlation of the two at 2 ms for the current tie shift */
  const DQ_PHI = [0.15, 0.45];
  function dqAlongWell(well) {
    const W = meta.dq_wiggle, kmStep = (meta.grid.km_max - meta.grid.km_min) / (W.nx - 1), t0 = well.t0, t1 = well.t0 + well.n * well.dt;
    const tj = well.grid.j.map(gridT), out = [];
    for (let j = 0; j < W.nt; j++) {
      const t = W.t_min + j * W.dt; if (t < t0 || t > t1 || t > tj[tj.length - 1] || t < tj[0]) continue;
      let k = 0; while (k < tj.length - 2 && tj[k + 1] < t) k++;
      const km = well.grid.km[k] + (well.grid.km[k + 1] - well.grid.km[k]) * (t - tj[k]) / (tj[k + 1] - tj[k]);
      const i = Math.round((km - meta.grid.km_min) / kmStep);
      let v = 0, n = 0; for (let ii = Math.max(0, i - 1); ii <= Math.min(W.nx - 1, i + 1); ii++) { v += dqWiggle[ii * W.nt + j]; n++; }
      out.push({ t, v: v / n });
    }
    return out;
  }
  function phiAt(well, t, halfWin) {   // log porosity averaged over t ± halfWin, with the tie shift applied
    const c = well.curves.PHID; if (!c) return null;
    const a = Math.max(0, Math.round((t - sh() - halfWin - well.t0) / well.dt)), b = Math.min(well.n - 1, Math.round((t - sh() + halfWin - well.t0) / well.dt));
    let s = 0, n = 0; for (let k = a; k <= b; k++) if (c.values[k] != null) { s += c.values[k]; n++; }
    return n ? s / n : null;
  }
  function drawDqTrack(g, t, well, Y, T, B, h) {
    const W = meta.dq_wiggle, mid = (t.x0 + t.x1) / 2, half = (t.x1 - t.x0) / 2 - 2;
    g.strokeStyle = "#5a5446"; g.strokeRect(t.x0, T, t.x1 - t.x0, h - T - B);
    g.fillStyle = "#1f1d18"; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.font = "600 11px Barlow, Arial, sans-serif";
    g.fillText("DQ, 2 ms", mid, T - 30);
    g.fillStyle = CURVE_COLOR.PHID; g.fillText("Density φ", mid, T - 19);
    g.font = "10px Barlow, Arial, sans-serif"; g.fillStyle = "#5a5446"; g.textAlign = "left"; g.fillText(`−${W.max} · ${DQ_PHI[0]}`, t.x0 + 1, T - 4);
    g.textAlign = "right"; g.fillText(`${W.max} · ${DQ_PHI[1]}`, t.x1 - 1, T - 4);
    if (!dqWiggle) return;
    const pts = dqAlongWell(well);
    g.save(); g.beginPath(); g.rect(t.x0, T, t.x1 - t.x0, h - T - B); g.clip();
    g.strokeStyle = "rgba(90,84,70,.4)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(mid, T); g.lineTo(mid, h - B); g.stroke();
    if (well.curves.PHID) {   // porosity on the same track, increasing to the right, so a match in shape shows directly
      g.strokeStyle = CURVE_COLOR.PHID; g.lineWidth = 1.6; g.beginPath(); let on = false;
      for (const p of pts) { const v = phiAt(well, p.t, 0.001); if (v == null) { on = false; continue; }
        const x = mid + Math.max(-1, Math.min(1, (v - (DQ_PHI[0] + DQ_PHI[1]) / 2) / ((DQ_PHI[1] - DQ_PHI[0]) / 2))) * half; on ? g.lineTo(x, Y(p.t)) : g.moveTo(x, Y(p.t)); on = true; }
      g.stroke();
    }
    g.strokeStyle = "#000"; g.lineWidth = 1.1; g.beginPath();
    pts.forEach((p, i) => { const x = mid + Math.max(-1, Math.min(1, p.v / W.max)) * half; i ? g.lineTo(x, Y(p.t)) : g.moveTo(x, Y(p.t)); });
    g.stroke(); g.restore();
    if (well.curves.PHID) {
      const pr = pts.map((p) => ({ x: p.v, y: phiAt(well, p.t, 0.001) })).filter((p) => p.y != null), r = corr(pr);
      g.font = "600 10.5px Barlow, Arial, sans-serif"; g.fillStyle = "#1f1d18"; g.textAlign = "center";
      g.fillText(r == null ? "" : `r = ${r.toFixed(2)} at 2 ms`, mid, T - 41);
    }
  }

  let wellGeom = null;
  function drawWellPanel() {
    const c = $("#wellPanel"), s = sizeCanvas(c); if (!s) return;
    const { g, w, h } = s, q = state.qi, well = qw(), L = 50, R = 42, T = 60, B = 10;
    const t0 = well.t0, t1 = well.t0 + well.n * well.dt, Y = (t) => T + (t - t0) / (t1 - t0) * (h - T - B), Yw = (t) => Y(t + sh());   // Yw: well-derived items, moved by the tie shift
    g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, h);
    const tracks = wellTracks(well), tot = tracks.reduce((a, t) => a + (t.w || 1), 0), gap = 6, tw = (w - L - R - gap * (tracks.length - 1)) / tot;
    let x = L;
    tracks.forEach((t) => { t.x0 = x; t.x1 = x + tw * (t.w || 1); x = t.x1 + gap; });
    // selected interval and guide lines at the tops, across every track
    const ivw = intervalOf(well, q.unit);
    if (ivw) { g.fillStyle = "rgba(255,209,102,.35)"; g.fillRect(L, Y(Math.max(ivw.top, t0)), w - L - R, Y(Math.min(ivw.base, t1)) - Y(Math.max(ivw.top, t0))); }
    g.lineWidth = 1;
    for (const u of well.units) if (u.top_twt + sh() > t0 && u.top_twt + sh() < t1) { g.strokeStyle = "rgba(90,84,70,.45)"; g.beginPath(); g.moveTo(L, Yw(u.top_twt)); g.lineTo(w - R, Yw(u.top_twt)); g.stroke(); }
    g.font = "11px Barlow, Arial, sans-serif";
    for (const t of tracks) {
      g.strokeStyle = "#5a5446"; g.strokeRect(t.x0, T, t.x1 - t.x0, h - T - B);
      g.fillStyle = "#1f1d18"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      if (t.type === "units") {
        g.fillText("Formation", (t.x0 + t.x1) / 2, T - 8);
        g.save(); g.beginPath(); g.rect(t.x0, T, t.x1 - t.x0, h - T - B); g.clip();
        for (const u of well.units) {
          const a = Y(Math.max(u.top_twt + sh(), t0)), b = Y(Math.min(u.base_twt + sh(), t1));
          g.fillStyle = u.color; g.globalAlpha = !ivw || (u.top_twt + sh() < ivw.base && u.base_twt + sh() > ivw.top) ? 0.85 : 0.3; g.fillRect(t.x0, a, t.x1 - t.x0, b - a); g.globalAlpha = 1;
          if (b - a > 11) { g.fillStyle = "#10151a"; g.font = `${u.target ? 700 : 500} 10px Barlow, Arial, sans-serif`; g.textAlign = "left"; g.textBaseline = "middle";
            g.fillText(unitShort(u.name) + (u.target ? " *" : ""), t.x0 + 3, (a + b) / 2, t.x1 - t.x0 - 5); }
        }
        if (classKind() === "fm" && FM_CLASSES[well.name]) {   // formation group of each attribute sample, as a strip on the right of the column
          const F = FM_CLASSES[well.name], sw = 9;
          well.grid.j.forEach((j) => { const tt = gridT(j), u = unitAt(well, tt), gi = F.groups.findIndex((gr) => u && gr.includes(u.name)); if (gi < 0) return;
            g.fillStyle = F.colors[gi]; g.fillRect(t.x1 - sw, Y(tt - 0.002), sw, Math.max(1, Y(tt + 0.002) - Y(tt - 0.002))); });
          g.strokeStyle = "#1f1d18"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(t.x1 - sw, T); g.lineTo(t.x1 - sw, h - B); g.stroke();
        }
        if (classKind() === "gr" && well.curves.GR) {   // gamma ray class of each attribute sample, as a strip on the right of the column
          const gr = blockedCurve(well, "GR"), cut = cutNow(), sw = 9;
          well.grid.j.forEach((j, i) => { if (gr[i] == null) return; const tt = gridT(j); g.fillStyle = CLASS_COLORS[gr[i] >= cut ? 1 : 0]; g.fillRect(t.x1 - sw, Y(tt - 0.002), sw, Math.max(1, Y(tt + 0.002) - Y(tt - 0.002))); });
          g.strokeStyle = "#1f1d18"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(t.x1 - sw, T); g.lineTo(t.x1 - sw, h - B); g.stroke();
        }
        g.restore(); g.font = "11px Barlow, Arial, sans-serif"; continue;
      }
      if (t.type === "dqwig") { drawDqTrack(g, t, well, Y, T, B, h); continue; }
      const keys = t.type === "attr" ? [t.key] : t.keys;
      const info = (k) => (t.type === "attr" ? { label: shortName(k), unit: meta.attributes[k].unit, min: meta.attributes[k].min, max: meta.attributes[k].max } : well.curves[k]);
      const i0 = info(keys[0]);
      keys.forEach((k, n) => { const I = info(k); g.fillStyle = t.type === "attr" ? "#1f1d18" : CURVE_COLOR[k]; g.font = "600 11px Barlow, Arial, sans-serif"; g.fillText(t.type === "attr" ? I.label : I.label.replace("Density porosity", "Density φ").replace("Neutron porosity", "Neutron φ"), (t.x0 + t.x1) / 2, T - 30 + n * 11); });
      g.font = "10px Barlow, Arial, sans-serif"; g.fillStyle = "#5a5446"; g.textAlign = "left"; g.fillText(fmt(i0.min), t.x0 + 1, T - 4); g.textAlign = "right"; g.fillText(fmt(i0.max), t.x1 - 1, T - 4);
      if (keys.length === 1 && t.type !== "attr") { g.textAlign = "center"; g.fillText(i0.unit, (t.x0 + t.x1) / 2, T - 4); }
      const XV = (v) => t.x0 + (Math.max(i0.min, Math.min(i0.max, v)) - i0.min) / (i0.max - i0.min) * (t.x1 - t.x0);
      g.save(); g.beginPath(); g.rect(t.x0, T, t.x1 - t.x0, h - T - B); g.clip();
      for (const k of keys) {
        if (t.type === "curve") {   // the log in 1 ms samples, thin and gray
          const v = well.curves[k].values; g.strokeStyle = "rgba(90,84,70,.35)"; g.lineWidth = 0.8; g.beginPath(); let on = false;
          v.forEach((val, i) => { if (val == null) { on = false; return; } const yy = Yw(t0 + i * well.dt); on ? g.lineTo(XV(val), yy) : g.moveTo(XV(val), yy); on = true; }); g.stroke();
        }
        const vals = t.type === "attr" ? well.grid.attrs[k] : blockedCurve(well, k);
        g.strokeStyle = t.type === "attr" ? "#1f1d18" : CURVE_COLOR[k]; g.lineWidth = 1.8; g.setLineDash(k === "NPHI" ? [5, 3] : []); g.beginPath(); let on = false;
        well.grid.j.forEach((j, i) => { const val = vals[i]; if (val == null) { on = false; return; } const yy = Y(gridT(j)); on ? g.lineTo(XV(val), yy) : g.moveTo(XV(val), yy); on = true; }); g.stroke(); g.setLineDash([]);
      }
      if (classKind() === "gr" && keys.includes("GR")) {   // the cutoff on the gamma ray track
        g.strokeStyle = "#9d0208"; g.lineWidth = 1.4; g.setLineDash([5, 3]); g.beginPath(); g.moveTo(XV(cutNow()), T); g.lineTo(XV(cutNow()), h - B); g.stroke(); g.setLineDash([]);
      }
      g.restore();
    }
    // depth on the left, two-way time on the right
    g.fillStyle = "#1f1d18"; g.font = "11px Barlow, Arial, sans-serif"; g.textBaseline = "middle";
    const px100 = well.depth_ticks.length > 1 ? Math.abs(Y(well.depth_ticks[1].twt) - Y(well.depth_ticks[0].twt)) : 99, every = px100 > 13 ? 100 : px100 > 6 ? 200 : 500;
    g.textAlign = "right";
    for (const d of well.depth_ticks) if (d.md % every === 0 && d.twt + sh() >= t0 && d.twt + sh() <= t1) { g.fillRect(L - 4, Yw(d.twt), 4, 1); g.fillText(String(d.md), L - 6, Yw(d.twt)); }
    g.textAlign = "left";
    for (let t = Math.ceil(t0 * 20) / 20; t <= t1 + 1e-9; t += 0.05) { g.fillRect(w - R, Y(t), 4, 1); g.fillText(t.toFixed(2), w - R + 6, Y(t)); }
    g.save(); g.font = "600 11px Barlow, Arial, sans-serif"; g.textAlign = "center";
    g.translate(11, (T + h - B) / 2); g.rotate(-Math.PI / 2); g.fillText(`Measured depth (m)`, 0, 0); g.restore();
    g.save(); g.font = "600 11px Barlow, Arial, sans-serif"; g.textAlign = "center";
    g.translate(w - 8, (T + h - B) / 2); g.rotate(Math.PI / 2); g.fillText("Two-way time (s)", 0, 0); g.restore();
    g.font = "700 12px Barlow, Arial, sans-serif"; g.textAlign = "left"; g.textBaseline = "top"; g.fillStyle = "#1f1d18";
    const off = well.grid.offset_m, offTxt = Math.max(...off) - Math.min(...off) < 50 ? `${(off[0] / 1000).toFixed(1)} km` : `${(Math.min(...off) / 1000).toFixed(1)}–${(Math.max(...off) / 1000).toFixed(1)} km`;
    g.fillText(`${well.name}, ${offTxt} from the line · log average ${winMs()} ms${state.qi.shift ? ` · tie shift ${state.qi.shift > 0 ? "+" : ""}${state.qi.shift} ms` : ""}`, 6, 3);
    if (q.hover && q.hover.well === well.name) { const yy = Y(q.hover.t); g.strokeStyle = "#e63946"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(L, yy); g.lineTo(w - R, yy); g.stroke(); }
    wellGeom = { Y, t0, t1, T, B, h };
  }

  /* ---------- the correlation bars ---------- */
  const ATTR_ORDER = () => Object.keys(meta.attributes);
  // bar colors by what each attribute measures
  const ATTR_GROUPS = [
    ["Waveform", "#3a6ea5", ["full_stack_amplitude", "near_stack_amplitude", "mid_stack_amplitude", "far_stack_amplitude", "relative_acoustic_impedance", "amplitude_volume_transform", "quadrature_trace", "instantaneous_phase", "cos_instantaneous_phase"]],
    ["Envelope and energy", "#8c5a2b", ["rms_amplitude", "envelope", "sweetness"]],
    ["Amplitude with angle", "#6d597a", ["far_minus_near"]],
    ["Frequency", "#2a9d8f", ["instantaneous_frequency", "spectral_ratio"]],
    ["Geometry", "#7a7a7a", ["apparent_dip", "dip_variability", "coherence"]],
    ["DQ", "#b5838d", ["dq", "theta_px", "dq_layer_average", "dq_layer_sum", "signed_isochron", "signed_half_isochron"]],
  ];
  const groupColor = (k) => (ATTR_GROUPS.find((g) => g[2].includes(k)) || [0, "#5a5446"])[1];
  const barColor = (k) => (k === state.qi.x ? "#be2d28" : groupColor(k));
  const BAR_KEY = " Red: the attribute on the horizontal axis. Other colors: " + ATTR_GROUPS.map(([n, c]) => `<span style="color:${c};font-weight:600">${n === "DQ" ? n : n.toLowerCase()}</span>`).join(", ") + ' (<button class="term" data-term="attrGroups">what each group measures</button>).';
  let corrRows = [];
  function drawQiCorr() {
    const q = state.qi, well = qw(), c = $("#qiCorr");
    const iv = intervalOf(well, q.unit), where = iv ? iv.label : "logged interval", tr = q.mode === "log" && q.detrend;
    if (classOn()) {
      // separation of the two classes by each attribute: difference of the class means in pooled standard deviations
      const fmk = classKind() === "fm", o = { ...q, mode: "log", y: fmk ? (q.mode === "log" ? q.y : fmY(well)) : "GR", color: fmk ? "fmclass" : "class", detrend: tr };
      corrRows = ATTR_ORDER().map((k) => {
        const pts = qiSamples(k, o), a = pts.filter((p) => p.cls === 0).map((p) => p.x), b = pts.filter((p) => p.cls === 1).map((p) => p.x);
        if (a.length < 5 || b.length < 5) return [k, null];
        const m = (v) => v.reduce((x, y) => x + y, 0) / v.length, va = (v, mm) => v.reduce((x, y) => x + (y - mm) ** 2, 0) / (v.length - 1);
        const ma = m(a), mb = m(b), sd = Math.sqrt((va(a, ma) + va(b, mb)) / 2);
        return [k, sd ? (mb - ma) / sd : null];
      });
      $("#qiCorrTitle").textContent = `Separation of the ${fmk ? "two groups of formations" : "gamma ray classes"}${tr ? ", trend removed" : ""}`;
      $("#qiCorrNote").innerHTML = 'Difference between the class means in <button class="term" data-term="separation">standard deviations</button>, for the samples on the crossplot. Axis fixed at −3 to 3. Clicking a bar puts that attribute on the horizontal axis.' + BAR_KEY;
      $("#qiCorrHelp").dataset.term = "helpQiSep";
      c.height = 26 + 18 * corrRows.length;
      hbars(c, corrRows.map(([k]) => shortName(k)), corrRows.map(([, r]) => (r == null ? NaN : r)),
        { min: -3, max: 3, colors: corrRows.map(([k]) => barColor(k)), valueFmt: (v) => (Number.isNaN(v) ? "n < 5" : v.toFixed(2)), labelOpposite: true, title: fmk ? `${well.name}, groups from the tops` : `${where}, cutoff ${cutNow()} API` });
      return;
    }
    const logKey = q.mode === "log" ? q.y : q.colorLog, o = { ...q, mode: "log", y: logKey, detrend: tr };
    corrRows = ATTR_ORDER().map((k) => [k, corr(qiSamples(k, o))]);
    $("#qiCorrTitle").textContent = `Correlation with ${well.curves[logKey].label.toLowerCase()}${tr ? ", trend removed" : ""}`;
    $("#qiCorrNote").innerHTML = 'Correlation coefficient <button class="term" data-term="correlation">r</button> for the samples on the crossplot. Axis fixed at −1 to 1. Clicking a bar puts that attribute on the horizontal axis.' + BAR_KEY;
    $("#qiCorrHelp").dataset.term = "helpQiCorr";
    c.height = 26 + 18 * corrRows.length;
    hbars(c, corrRows.map(([k]) => shortName(k)), corrRows.map(([, r]) => (r == null ? NaN : r)),
      { min: -1, max: 1, colors: corrRows.map(([k]) => barColor(k)), valueFmt: (v) => (Number.isNaN(v) ? "n < 5" : v.toFixed(2)), labelOpposite: true, title: `${well.name}, ${where}, ${winMs()} ms` });
  }

  function drawQiLegend() {
    const el = $("#qiLegend"), well = qw(); el.innerHTML = "";
    for (const u of well.units) {
      const b = document.createElement("button"); b.setAttribute("aria-pressed", String(state.qi.unit === u.name));
      b.innerHTML = `<i style="background:${u.color}"></i>${unitShort(u.name)}${u.target ? " *" : ""}`;
      b.title = "Show only this interval on the crossplot";
      b.addEventListener("click", () => { state.qi.unit = state.qi.unit === u.name ? "all" : u.name; $("#qiUnit").value = state.qi.unit; drawQi(); });
      el.append(b);
    }
  }

  async function drawQi() {
    if (state.stage !== 8 || !logs) return;
    $("#qiWinText").textContent = `${winMs()} ms`;
    $("#qiCutRow").hidden = classKind() !== "gr"; $("#qiCut").value = cutNow(); $("#qiCutText").textContent = `${cutNow()} API`;
    $("#qiShift").value = state.qi.shift; $("#qiShiftText").textContent = state.qi.shift ? `${state.qi.shift > 0 ? "+" : ""}${state.qi.shift} ms, logs and tops moved ${state.qi.shift > 0 ? "down" : "up"}` : "0 ms";
    $("#qiPolyInfo").textContent = state.qi.closed && qiMaskInfo ? `${(qiMaskInfo.share * 100).toFixed(1)}% of the samples in the study window (0–40 km, 0.15–2.0 s) fall inside the polygon, shown in yellow on the section.` : "";
    if (state.qi.mode === "log" && isDq(state.qi.x) && !dqWiggle) await loadWiggle();
    drawWellPanel(); drawQiCorr(); drawQiLegend(); await drawXplot();
  }

  function fillQiSelects() {
    const q = state.qi, well = qw(), curves = Object.entries(well.curves);
    if (!well.curves[q.y]) q.y = "GR";
    if (q.colorLog === "fmclass" && !FM_CLASSES[well.name]) q.colorLog = "class";
    if (q.color === "fmclass" && !FM_CLASSES[well.name]) q.color = "class";
    if (!["class", "fmclass"].includes(q.colorLog) && !well.curves[q.colorLog]) q.colorLog = "GR";
    if (!["unit", "twt", "class", "fmclass"].includes(q.color) && !well.curves[q.color]) q.color = "unit";
    const opt = (v, t) => Object.assign(document.createElement("option"), { value: v, textContent: t });
    const ySel = $("#qiY"), cSel = $("#qiColor"), clSel = $("#qiColorLog"), uSel = $("#qiUnit");
    ySel.innerHTML = ""; clSel.innerHTML = ""; cSel.innerHTML = ""; uSel.innerHTML = "";
    for (const [k, cv] of curves) { ySel.append(opt(k, `${cv.label} (${cv.unit})`)); clSel.append(opt(k, `${cv.label} (${cv.unit})`)); }
    clSel.append(opt("class", "Gamma ray class (cutoff)"));
    cSel.append(opt("unit", "Formation"), opt("twt", "Two-way time"), opt("class", "Gamma ray class (cutoff)"));
    if (FM_CLASSES[well.name]) { clSel.append(opt("fmclass", "Formation groups (tops)")); cSel.append(opt("fmclass", "Formation groups (tops)")); }
    for (const [k, cv] of curves) cSel.append(opt(k, cv.label));
    uSel.append(opt("all", "Whole logged interval"));
    (PACKAGES[well.name] || []).forEach((p, i) => uSel.append(opt(`pkg:${i}`, p[0])));
    for (const u of well.units) uSel.append(opt(u.name, unitShort(u.name) + (u.target ? " *" : "")));
    if (!intervalOf(well, q.unit)) q.unit = "all";
    ySel.value = q.y; cSel.value = q.color; clSel.value = q.colorLog; uSel.value = q.unit;
  }

  function syncQiControls() {
    const q = state.qi;
    $$("#qiWell button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.well === q.well)));
    $$("[name=qiMode]").forEach((b) => (b.checked = b.value === q.mode));
    $$("[data-mode]").forEach((el) => (el.hidden = el.dataset.mode !== q.mode));
    fillQiSelects();
    $("#qiX").value = q.x; $("#qiY2").value = q.y2; $("#qiWin").value = q.win; $("#qiDetrend").checked = q.detrend;
  }

  function qiChanged() { syncQiControls(); refresh(); }

  const QI_STEPS = {
    1: { well: "CAL-GT-04", mode: "log", x: "instantaneous_frequency", y: "GR", color: "class", cut: 75, win: 0, detrend: false, shift: 0, unit: "pkg:0", zoom: "well" },
    2: { well: "CAL-GT-04", mode: "log", x: "instantaneous_frequency", y: "GR", color: "class", cut: 75, win: 0, detrend: true, shift: 0, unit: "pkg:0", zoom: "well" },
    3: { well: "ASTEN-GT-02", mode: "log", x: "spectral_ratio", y: "GR", color: "class", cut: 65, win: 0, detrend: false, shift: 0, unit: "pkg:0", zoom: "someren" },
    4: { well: "ASTEN-GT-02", mode: "log", x: "rms_amplitude", y: "PHID", color: "twt", win: 0, detrend: false, shift: 0, unit: "all", zoom: "someren" },
    5: { well: "ASTEN-GT-02", mode: "log", x: "rms_amplitude", y: "PHID", color: "twt", win: 0, detrend: true, shift: 0, unit: "all", zoom: "someren" },
    6: { well: "ASTEN-GT-02", mode: "log", x: "spectral_ratio", y: "GR", color: "class", cut: 65, win: 0, detrend: false, shift: 8, unit: "pkg:0", zoom: "someren" },
    7: { well: "ASTEN-GT-02", mode: "attr", x: "spectral_ratio", y2: "far_minus_near", colorLog: "class", cut: 65, win: 0, shift: 0, unit: "pkg:0", zoom: "study" },
    8: { well: "ASTEN-GT-02", mode: "log", x: "spectral_ratio", y: "GR", color: "class", cut: 65, win: 0, detrend: false, shift: 0, unit: "pkg:0", zoom: "study", som: true },
    9: { well: "ASTEN-GT-02", mode: "log", x: "rms_amplitude", y: "GR", color: "unit", win: 0, detrend: false, shift: 0, unit: "Houthem Formation", zoom: "someren" },
  };

  /* the attributes that separate the gamma ray classes most at the current well and interval, skipping any that
     correlate at 0.9 or more along the well with one already chosen */
  function chooseForSom(nPick = 4, kind = "gr") {
    const w = qw(), q = state.qi, rows = [];
    const o = kind === "fm" ? { ...q, mode: "log", y: fmY(w), color: "fmclass", unit: "all", detrend: false } : { ...q, mode: "log", y: "GR", color: "class", detrend: false };
    for (const k of ATTR_ORDER()) {
      const pts = qiSamples(k, o), a = pts.filter((p) => p.cls === 0).map((p) => p.x), b = pts.filter((p) => p.cls === 1).map((p) => p.x);
      if (a.length < 5 || b.length < 5) continue;
      const m = (v) => v.reduce((x, y) => x + y, 0) / v.length, va = (v, mm) => v.reduce((x, y) => x + (y - mm) ** 2, 0) / (v.length - 1);
      const sd = Math.sqrt((va(a, m(a)) + va(b, m(b))) / 2); if (sd) rows.push([k, Math.abs((m(b) - m(a)) / sd), pts]);
    }
    rows.sort((x, y) => y[1] - x[1]);
    const chosen = [];
    for (const [k, , pts] of rows) {
      if (chosen.length >= nPick) break;
      const xs = pts.map((p) => p.k);
      const dup = chosen.some((c) => { const pa = xs.map((i) => ({ x: w.grid.attrs[k][i], y: w.grid.attrs[c][i] })).filter((p) => p.x != null && p.y != null); return Math.abs(corr(pa) ?? 0) >= 0.9; });
      if (!dup) chosen.push(k);
    }
    return chosen;
  }

  function wireQi() {
    const xSel = $("#qiX"), y2Sel = $("#qiY2"), groups = {};
    for (const [k, a] of Object.entries(meta.attributes)) (groups[a.family] ??= []).push([k, a]);
    for (const sel of [xSel, y2Sel]) for (const [fam, list] of Object.entries(groups)) {
      const og = document.createElement("optgroup"); og.label = fam;
      for (const [k, a] of list) og.append(Object.assign(document.createElement("option"), { value: k, textContent: a.label }));
      sel.append(og);
    }
    xSel.addEventListener("change", () => { state.qi.x = xSel.value; state.qi.closed = false; state.qi.poly = []; qiChanged(); });
    y2Sel.addEventListener("change", () => { state.qi.y2 = y2Sel.value; state.qi.closed = false; state.qi.poly = []; qiChanged(); });
    $("#qiY").addEventListener("change", (e) => { state.qi.y = e.target.value; drawQi(); });
    $("#qiColor").addEventListener("change", (e) => { state.qi.color = e.target.value; drawQi(); });
    $("#qiColorLog").addEventListener("change", (e) => { state.qi.colorLog = e.target.value; drawQi(); });
    $("#qiUnit").addEventListener("change", (e) => { state.qi.unit = e.target.value; drawQi(); });
    $("#qiWin").addEventListener("input", (e) => { state.qi.win = +e.target.value; drawQi(); });
    $("#qiDetrend").addEventListener("change", (e) => { state.qi.detrend = e.target.checked; drawQi(); });
    $("#qiCut").addEventListener("input", (e) => { state.qi.cuts[state.qi.well] = +e.target.value; drawQi(); });
    $("#qiShift").addEventListener("input", (e) => { state.qi.shift = +e.target.value; drawQi(); });
    $("#qiCorr").addEventListener("click", (e) => {   // a bar puts its attribute on the horizontal axis
      const c = e.currentTarget, r = c.getBoundingClientRect(), y = (e.clientY - r.top) * c.height / r.height, top = 20, rowH = (c.height - top - 18) / corrRows.length;
      const i = Math.floor((y - top) / rowH); if (i < 0 || i >= corrRows.length) return;
      state.qi.x = corrRows[i][0]; state.qi.poly = []; state.qi.closed = false; qiChanged();
    });
    $$("[name=qiMode]").forEach((b) => b.addEventListener("change", (e) => { state.qi.mode = e.target.value; qiChanged(); }));
    $$("#qiWell button").forEach((b) => b.addEventListener("click", () => {
      state.qi.well = b.dataset.well; state.qi.hover = null; setZoom(WELL_STYLE[b.dataset.well].zoom); qiChanged();
    }));
    $$("#qiSteps [data-qi]").forEach((b) => b.addEventListener("click", () => {
      const p = QI_STEPS[b.dataset.qi];
      const { cut, zoom, som, ...rest } = p;
      Object.assign(state.qi, { poly: [], closed: false, hover: null }, rest);
      if (cut != null) state.qi.cuts[p.well] = cut;
      state.explore.picking = false; $("#pickCtl").hidden = true;
      if (som) {   // the log-selected attributes go to the SOM list, and the page moves to Build a SOM
        const chosen = chooseForSom();
        state.picked = new Set(chosen); syncPicks();
        $("#qiToSomInfo").textContent = `Chosen at ${p.well} from the gamma ray classes: ${chosen.map((k) => meta.attributes[k].label).join(", ")}.`;
        setZoom(zoom); setStage(4); return;
      }
      setZoom(zoom || WELL_STYLE[p.well].zoom);
      $$("#qiSteps [data-qi]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$("#exSteps [data-ex]").forEach((x) => x.setAttribute("aria-pressed", "false"));
      state.explore.picking = false; $("#pickCtl").hidden = true;
      if (state.stage !== 8) setStage(8);
      qiChanged();
    }));
    $("#qiPolyClear").addEventListener("click", () => { Object.assign(state.qi, { poly: [], closed: false }); refresh(); });
    $("#qiPolyUndo").addEventListener("click", () => { if (state.qi.closed) state.qi.closed = false; else state.qi.poly.pop(); refresh(); });
    $("#qiToSom").addEventListener("click", () => {
      const add = state.qi.mode === "attr" ? [state.qi.x, state.qi.y2] : [state.qi.x];
      add.forEach((k) => state.picked.add(k)); syncPicks();
      $("#qiToSomInfo").textContent = `Added ${add.map((k) => meta.attributes[k].label).join(" and ")}. Attributes chosen for the SOM: ${[...state.picked].map((k) => meta.attributes[k].label).join(", ")}.`;
    });
    $("#qiOpacity")?.addEventListener("input", (e) => { state.attrOpacity = +e.target.value; $("#attrOpacity").value = state.attrOpacity; draw(); });

    const xp = $("#xplot");
    xp.addEventListener("mousemove", (e) => {
      const r = xp.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = null, bd = 10; for (const p of qiPts) { const d = Math.hypot(p.px - mx, p.py - my); if (d < bd) { bd = d; best = p; } }
      const nh = best ? { well: state.qi.well, j: best.j, t: best.t, km: best.km } : null;
      if ((nh && nh.j) !== (state.qi.hover && state.qi.hover.j)) { state.qi.hover = nh; drawWellPanel(); drawXplot(); draw(); }
      if (best) {
        const well = qw(), u = best.u ? unitShort(best.u.name) : "";
        $("#readout").textContent = `${well.name}, ${best.t.toFixed(3)} s${u ? `, ${u}` : ""}: ${shortName(state.qi.x)} ${fmt(best.x0)}, ${state.qi.mode === "log" ? `${well.curves[state.qi.y].label.toLowerCase()} ${fmt(best.y0)}` : `${shortName(state.qi.y2)} ${fmt(best.y0)}`}`;
      }
    });
    xp.addEventListener("mouseleave", () => { if (state.qi.hover) { state.qi.hover = null; drawWellPanel(); drawXplot(); draw(); } });
    xp.addEventListener("click", (e) => {
      const q = state.qi; if (q.mode !== "attr" || !xplotGeom) return;
      const r = xp.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, G = xplotGeom;
      if (mx < XP.l || mx > G.w - XP.r || my < XP.t || my > G.h - XP.b) return;
      if (q.closed) { q.poly = []; q.closed = false; }
      if (q.poly.length >= 3 && Math.hypot(G.PX(q.poly[0][0]) - mx, G.PY(q.poly[0][1]) - my) < 11) { q.closed = true; q.version = (q.version || 0) + 1; refresh(); return; }
      const xv = G.xr[0] + (mx - XP.l) / (G.w - XP.l - XP.r) * (G.xr[1] - G.xr[0]), yv = G.yr[0] + (G.h - XP.b - my) / (G.h - XP.t - XP.b) * (G.yr[1] - G.yr[0]);
      q.poly.push([xv, yv]); drawXplot();
    });
    const wp = $("#wellPanel");
    wp.addEventListener("mousemove", (e) => {
      if (!wellGeom) return; const r = wp.getBoundingClientRect(), my = e.clientY - r.top, G = wellGeom;
      if (my < G.T || my > G.h - G.B) return;
      const t = G.t0 + (my - G.T) / (G.h - G.T - G.B) * (G.t1 - G.t0), well = qw();
      let k = 0, bd = Infinity; well.grid.j.forEach((j, i) => { const d = Math.abs(gridT(j) - t); if (d < bd) { bd = d; k = i; } });
      const j = well.grid.j[k];
      if (!state.qi.hover || state.qi.hover.j !== j) { state.qi.hover = { well: well.name, j, t: gridT(j), km: well.grid.km[k] }; drawWellPanel(); drawXplot(); draw(); }
      const u = unitAt(well, gridT(j));
      $("#readout").textContent = `${well.name}, ${gridT(j).toFixed(3)} s${u ? `, ${unitShort(u.name)}` : ""}`;
    });
    wp.addEventListener("mouseleave", () => { if (state.qi.hover) { state.qi.hover = null; drawWellPanel(); drawXplot(); draw(); } });
    new ResizeObserver(() => drawQi()).observe($("#qiPanel"));
    syncQiControls();
  }

  function drawQiMarker() {
    const hv = state.qi.hover; if (!hv) return;
    const x = X(hv.km), y = Y(hv.t); cx.save(); clipPlot();
    cx.lineWidth = 3.5; cx.strokeStyle = "#000"; cx.beginPath(); cx.arc(x, y, 8, 0, Math.PI * 2); cx.stroke();
    cx.lineWidth = 2; cx.strokeStyle = "#e63946"; cx.stroke(); cx.restore();
  }

  /* ---------- Part 1 of the exercise: exploring the Someren area from Californië, with ASTEN-GT-02 hidden until the reveal ---------- */
  const HIDDEN_WELL = "ASTEN-GT-02", HOUTHEM = "Houthem Formation";
  state.explore = { revealed: false, pick: [], picking: false, houthemNeurons: null };
  const wellMeta = (name) => (meta.wells || []).find((w) => w.name === name);
  const pathAt = (w, t) => {   // km of a well path at two-way time t
    const p = w.path.filter((q, i) => i === 0 || q.twt > w.path[i - 1].twt);
    if (t <= p[0].twt) return p[0].km;
    for (let i = 1; i < p.length; i++) if (p[i].twt >= t) return p[i - 1].km + (p[i].km - p[i - 1].km) * (t - p[i - 1].twt) / (p[i].twt - p[i - 1].twt);
    return p[p.length - 1].km;
  };
  function unitRange(w, unit) {   // top and base two-way time of a unit in a well, from the tops
    const tops = [...w.tops].sort((a, b) => a.twt - b.twt), i = tops.findIndex((t) => t.unit === unit); if (i < 0) return null;
    const base = i + 1 < tops.length ? tops[i + 1].twt : Math.max(...w.path.map((p) => p.twt));
    return [tops[i].twt, base];
  }

  function applyHidden() {
    const hid = !state.explore.revealed;
    if (hid) state.hiddenWells.add(HIDDEN_WELL); else state.hiddenWells.delete(HIDDEN_WELL);
    const chip = $(`#wellChips [data-well="${HIDDEN_WELL}"]`); if (chip) { chip.hidden = hid; chip.setAttribute("aria-pressed", String(!hid)); }
    const wb = $(`#qiWell [data-well="${HIDDEN_WELL}"]`); if (wb) wb.hidden = hid;
    if (hid && state.qi.well === HIDDEN_WELL) state.qi.well = "CAL-GT-04";
    $$(".beforeReveal").forEach((el) => (el.hidden = !hid));
    $$(".afterReveal").forEach((el) => (el.hidden = hid));
    $$("#qiSteps [data-qi]").forEach((b) => (b.disabled = hid));
  }

  /* the student's Houthem pick: points in km and two-way time, kept in order along the line */
  function pickT(km) {
    const p = state.explore.pick; if (p.length < 2 || km < p[0][0] || km > p[p.length - 1][0]) return null;
    for (let i = 1; i < p.length; i++) if (p[i][0] >= km) return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * (km - p[i - 1][0]) / (p[i][0] - p[i - 1][0]);
    return null;
  }
  function addPickPoint(km, t) {
    const p = state.explore.pick; p.push([km, t]); p.sort((a, b) => a[0] - b[0]);
    updatePickInfo(); draw(); drawPickProfile();
  }
  function updatePickInfo() {
    const p = state.explore.pick;
    $("#pickInfo").textContent = p.length ? `${p.length} point${p.length > 1 ? "s" : ""}, ${p[0][0].toFixed(1)}–${p[p.length - 1][0].toFixed(1)} km.` : "No points yet.";
    $("#pickProfileWrap").hidden = !(p.length >= 2 && state.stage <= 3);
  }
  function drawHouthemPick() {
    const p = state.explore.pick; if (!p.length) return;
    cx.save(); clipPlot(); cx.lineJoin = "round";
    for (const [col, w] of [["#000", 5], ["#00e5ff", 2.4]]) { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); p.forEach(([k, t], i) => (i ? cx.lineTo : cx.moveTo).call(cx, X(k), Y(t))); cx.stroke(); }
    for (const [k, t] of p) { cx.fillStyle = "#00e5ff"; cx.strokeStyle = "#000"; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(X(k), Y(t), 3.5, 0, Math.PI * 2); cx.fill(); cx.stroke(); }
    const [k0, t0] = p[0]; cx.font = "700 11px Barlow, Arial, sans-serif"; cx.textBaseline = "bottom"; cx.textAlign = "left";
    const lab = "Houthem pick", tw = cx.measureText(lab).width + 8; cx.fillStyle = "rgba(20,24,26,.85)"; cx.fillRect(X(k0) + 6, Y(t0) - 20, tw, 15); cx.fillStyle = "#00e5ff"; cx.fillText(lab, X(k0) + 10, Y(t0) - 6);
    cx.restore();
  }

  /* the displayed attribute along the pick: mean of five 4 ms samples centered on the pick at each 20 m trace, fixed axis */
  function drawPickProfile() {
    const wrap = $("#pickProfileWrap"), p = state.explore.pick; updatePickInfo();
    if (wrap.hidden) return;
    const c = $("#pickProfile"), s = sizeCanvas(c); if (!s) return;
    const { g, w, h } = s, key = state.attr, A = meta.attributes[key], d = cache[`attr_${key}.bin`], G = meta.grid, v = view();
    const T = 22, B = 26, PX = (km) => MARGIN.l + (km - v.kmA) / (v.kmB - v.kmA) * (w - MARGIN.l - MARGIN.r), PY = (val) => h - B - (val - A.min) / (A.max - A.min) * (h - T - B);
    g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#5a5446"; g.lineWidth = 1; g.strokeRect(MARGIN.l, T, w - MARGIN.l - MARGIN.r, h - T - B);
    g.font = "11px Barlow, Arial, sans-serif"; g.fillStyle = "#1f1d18"; g.textAlign = "right"; g.textBaseline = "middle";
    g.fillText(fmt(A.max), MARGIN.l - 4, T); g.fillText(fmt(A.min), MARGIN.l - 4, h - B);
    g.textAlign = "left"; g.textBaseline = "top"; g.font = "700 12px Barlow, Arial, sans-serif";
    g.fillText(`${A.label} along the Houthem pick (mean of five samples, ±8 ms)`, MARGIN.l, 4);
    // Someren license limits and the wells, as guide lines down from the section
    const [sa, sb] = meta.someren.km; g.setLineDash([6, 4]); g.strokeStyle = "#2a9d8f";
    for (const k of [sa, sb]) if (k > v.kmA && k < v.kmB) { g.beginPath(); g.moveTo(PX(k), T); g.lineTo(PX(k), h - B); g.stroke(); }
    g.setLineDash([]);
    const marks = [["CAL-GT-04", pathAt(wellMeta("CAL-GT-04"), unitRange(wellMeta("CAL-GT-04"), HOUTHEM)[0]), "#b8860b"]];
    if (state.explore.revealed) marks.push([HIDDEN_WELL, wellMeta(HIDDEN_WELL).path[0].km, "#7b5ea7"]);
    g.font = "600 10.5px Barlow, Arial, sans-serif"; g.textBaseline = "top";
    for (const [n, k, col] of marks) if (k > v.kmA && k < v.kmB) { g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.moveTo(PX(k), T); g.lineTo(PX(k), h - B); g.stroke(); g.fillStyle = col; g.textAlign = "center"; g.fillText(n, PX(k), h - B + 4); }
    g.fillStyle = "#1f1d18"; g.textAlign = "center";
    for (let k = Math.ceil(v.kmA / 5) * 5; k <= v.kmB; k += 5) g.fillText(String(k), PX(k), h - 12);
    if (!d) { loadBin(`attr_${key}.bin`, Uint8Array).then(() => drawPickProfile()); return; }
    if (p.length < 2) return;
    const kmStep = (G.km_max - G.km_min) / (G.nx - 1), jm = lastJ(key);
    g.save(); g.beginPath(); g.rect(MARGIN.l, T, w - MARGIN.l - MARGIN.r, h - T - B); g.clip();
    g.strokeStyle = "#be2d28"; g.lineWidth = 1.6; g.beginPath(); let on = false;
    for (let i = Math.ceil((p[0][0] - G.km_min) / kmStep); i * kmStep + G.km_min <= p[p.length - 1][0]; i++) {
      const km = G.km_min + i * kmStep, t = pickT(km); if (t == null) continue;
      const j0 = Math.round((t - meta.t_min) / G.dt); let sum = 0, n = 0;
      for (let j = j0 - 2; j <= j0 + 2; j++) if (j >= 0 && j <= jm) { sum += A.min + d[i * G.nt + j] / 255 * (A.max - A.min); n++; }
      if (!n) { on = false; continue; }
      const x = PX(km), y = PY(sum / n); on ? g.lineTo(x, y) : g.moveTo(x, y); on = true;
    }
    g.stroke(); g.restore();
  }

  /* SOM neurons of the Houthem samples at a well */
  function neuronsAt(r, wellName) {
    const w = wellMeta(wellName), rg = unitRange(w, HOUTHEM), G = meta.grid, out = [];
    if (!rg || !r) return out;
    for (let j = Math.ceil((rg[0] - meta.t_min) / G.dt); meta.t_min + j * G.dt < rg[1]; j++) {
      const t = meta.t_min + j * G.dt, i = Math.round((pathAt(w, t) - G.km_min) / (G.km_max - G.km_min) * (G.nx - 1)), k = r.bmu[i * G.nt + j];
      if (k !== 255) out.push(k);
    }
    return out;
  }

  function revealReport() {
    const w = wellMeta(HIDDEN_WELL), km = w.path[0].km, top = unitRange(w, HOUTHEM)[0], tp = pickT(km), lines = [];
    lines.push(`${HIDDEN_WELL} lies at ${km.toFixed(1)} km, ${(w.path[0].offset_m / 1000).toFixed(1)} km from the line. Its Houthem Formation top is at ${top.toFixed(3)} s (1635 m measured depth).`);
    lines.push(tp == null ? "The Houthem pick does not reach this position along the line." : `The Houthem pick there is at ${tp.toFixed(3)} s, ${Math.abs(Math.round((tp - top) * 1000))} ms ${tp > top ? "below" : "above"} the top in the well.`);
    const r = run(), set = state.explore.houthemNeurons;
    if (r && set) {
      const ks = neuronsAt(r, HIDDEN_WELL), hit = ks.filter((k) => set.has(k)).length;
      lines.push(`SOM: ${hit} of ${ks.length} Houthem samples at ${HIDDEN_WELL} fall on the neurons of the Houthem at CAL-GT-04.`);
    }
    lines.push("At ASTEN-GT-02 the Veldhoven Formation spans 707–1415 m, with the Someren, Wintelre, Voort and Steensel members; at CAL-GT-04 the Veldhoven Clay Member spans 315–500 m.");
    $("#revealReport").innerHTML = lines.map((l) => `<p class="small">${l}</p>`).join("");
  }

  const EX_STEPS = {
    1: () => { Object.assign(state.qi, { well: "CAL-GT-04", mode: "log", x: "rms_amplitude", y: "DRILL", color: "unit", unit: "all", win: 0, detrend: false, shift: 0, poly: [], closed: false, hover: null });
      setZoom("well"); setStage(8); qiChanged(); },
    2: () => { state.explore.picking = true; setZoom("study"); setStage(1); },
    3: () => { Object.assign(state.qi, { well: "CAL-GT-04", mode: "log", y: "DRILL", color: "fmclass", unit: "all", win: 0, detrend: false, shift: 0, poly: [], closed: false, hover: null });
      setZoom("well"); setStage(8); qiChanged(); },
    4: () => { const prev = state.qi.well; state.qi.well = "CAL-GT-04"; const best = chooseForSom(1, "fm")[0]; state.qi.well = prev;
      if (best) { state.attr = best; $("#attrSelect").value = best; drawColorbar(); syncPicks(); }
      $("#exInfo").textContent = best ? `${meta.attributes[best].label} separates the two groups of formations at CAL-GT-04 most.` : "";
      setZoom("study"); setStage(3); },
    5: () => { const prev = state.qi.well; state.qi.well = "CAL-GT-04"; const chosen = chooseForSom(4, "fm"); state.qi.well = prev;
      state.picked = new Set(chosen); syncPicks();
      $("#exInfo").textContent = `Chosen at CAL-GT-04 from the formation groups: ${chosen.map((k) => meta.attributes[k].label).join(", ")}. Train the SOM in this stage.`;
      setZoom("study"); setStage(4); },
    6: () => { const r = run();
      if (!r) { $("#exInfo").textContent = "Train a SOM first (step 5)."; setStage(4); return; }
      const set = new Set(neuronsAt(r, "CAL-GT-04")); state.explore.houthemNeurons = set;
      r.hidden = new Set([...Array(r.side * r.side).keys()].filter((k) => !set.has(k)));
      $("#exInfo").textContent = `The Houthem samples at CAL-GT-04 fall on ${set.size} neuron${set.size === 1 ? "" : "s"}; only those classes are shown along the line. The other neurons can be switched back on in the SOM grid.`;
      setZoom("study"); setStage(4); updateNeuronInfo?.(); },
    7: () => { setStage(5); },
    8: () => { state.explore.revealed = true; state.explore.picking = false; applyHidden(); revealReport(); setZoom("someren"); setStage(1); },
  };

  function wireExplore() {
    $$("#wellChips button").forEach((b) => { const w = (meta.wells || []).find((x) => x.name === b.textContent); if (w) b.dataset.well = w.name; });
    $$("#exSteps [data-ex]").forEach((b) => b.addEventListener("click", () => {
      if (+b.dataset.ex !== 2) state.explore.picking = false;
      $$("#exSteps [data-ex]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$("#qiSteps [data-qi]").forEach((x) => x.setAttribute("aria-pressed", "false"));
      $("#exInfo").textContent = "";
      EX_STEPS[b.dataset.ex]();
      $("#pickCtl").hidden = !state.explore.picking;
      updatePickInfo(); refresh();
    }));
    $("#pickUndo").addEventListener("click", () => { state.explore.pick.pop(); updatePickInfo(); draw(); drawPickProfile(); });
    $("#pickClearAll").addEventListener("click", () => { state.explore.pick = []; updatePickInfo(); draw(); drawPickProfile(); });
    $("#pickDone").addEventListener("click", () => { state.explore.picking = false; $("#pickCtl").hidden = true; });
    new ResizeObserver(() => drawPickProfile()).observe($("#pickProfileWrap"));
    applyHidden(); updatePickInfo();
  }

  /* ---------- pick mode (open the page with ?pick) ---------- */
  function pickAt(km, t, remove) {
    const unit = $("#pickHorizon").value, list = (picks[unit] ??= []);
    if (remove) {
      if (!list.length) return;
      let best = 0, bd = Infinity; list.forEach(([k, tt], i) => { const d = Math.hypot(X(k) - X(km), Y(tt) - Y(t)); if (d < bd) { bd = d; best = i; } });
      list.splice(best, 1);
    } else {
      if ($("#pickSnap").checked) {
        const h = meta.horizons.items.find((x) => x.unit === unit), nx = meta.section.nx, nt = meta.nt;
        const i = Math.round((km - meta.km_min) / (meta.km_max - meta.km_min) * (nx - 1)), j = Math.round((t - meta.t_min) / meta.dt);
        let bj = j, bv = -Infinity;
        for (let q = Math.max(0, j - 4); q <= Math.min(nt - 1, j + 4); q++) { const v = h.polarity * section[i * nt + q]; if (v > bv) { bv = v; bj = q; } }
        t = meta.t_min + bj * meta.dt;
      }
      list.push([+km.toFixed(4), +t.toFixed(4)]); list.sort((a, b) => a[0] - b[0]);
    }
    invalidateHorizons(); draw();
  }

  function setupPickMode() {
    if (!PICK_MODE) return;
    $("#pickPanel").hidden = false;
    const sel = $("#pickHorizon");
    for (const h of meta.horizons.items) sel.append(Object.assign(document.createElement("option"), { value: h.unit, textContent: h.label }));
    sel.addEventListener("change", draw);
    $("#pickClear").addEventListener("click", () => { delete picks[sel.value]; invalidateHorizons(); draw(); });
    $("#pickSave").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(picks, null, 1)], { type: "application/json" });
      Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "horizon_picks.json" }).click();
    });
  }

  async function init() {
    try {
      meta = await (await fetch("data/meta.json")).json();
      section = await loadBin("section.bin", Int8Array);
    } catch (err) {
      $("#readout").textContent = `${err.message} The page needs to be served over http (for example GitHub Pages or "python -m http.server"), not opened as a file.`;
      return;
    }
    try { const r = await fetch("data/horizon_picks.json"); if (r.ok) picks = await r.json(); } catch (_) { /* no picks yet */ }
    try { logs = await (await fetch("data/logs.json")).json(); } catch (_) { logs = null; }
    autoHorizons = meta.horizons.items;
    baseImg = raster(meta.section.nx, meta.nt, grayAt);
    wire(); wireWellChips(); wireGeology(); wireBuilder(); wireNeuronToggles(); wireCompare(); wireSomPicks(); setupPickMode(); wireWiggles(); if (logs) wireQi(); wireExplore(); drawColorbar(); resize(); refresh();
  }
  init();
})();
