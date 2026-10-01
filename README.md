# The SCAN029 case: seismic attributes alongside QI, tested against well logs

An interactive board for a guided lecture, prepared by attribute specialists for an audience that includes quantitative interpretation (QI) practitioners, on what seismic attributes can add alongside QI work: how well logs are used to test and choose attributes, the checks that decide whether an attribute–log relationship holds (depth trend, averaging scale, well tie, redundancy, sample count), and how a machine learning model built on the chosen attributes can be checked with SHAP. The tool contains no inversion, Vp/Vs, intercept or gradient, so it does not compare attributes with QI results.

The exercise runs in two parts, listed in a panel shown on every stage. In part 1 the well inside the Someren license, ASTEN-GT-02, is hidden, and the prospect is explored from CAL-GT-04 at Californië: tying the well tops, picking the Houthem Formation westward across the fault zone, plotting along the pick the attribute that changes most at the top of the chalk at CAL-GT-04 (samples grouped by the tops: Houthem and Maastricht against the Landen Clay to Swalmen members), training a SOM on the attributes chosen there, showing where the classes of the Californië Houthem occur along the line, and checking them with SHAP. The last step reveals ASTEN-GT-02 and reports the Houthem top in the well against the pick at that position, and the share of the well's Houthem samples that fall on the Californië Houthem neurons. Part 2, available after the reveal, is the well-log part: gamma ray classes, the trend with time, the averaging window, the well tie, the polygon and the log-selected SOM.

The page loads precomputed data and trains the SOM in the browser, so it runs on GitHub Pages or any static web server.

## Exercise

1. The section, with the Californië wells and karst zones at the east end, and the Someren license crossing and ASTEN-GT-02 at the west end. A short note under the title states the candidate aquifers at Someren and the producing interval at Californië.
2. Attributes, one at a time, over the whole line.
3. The attributes along ASTEN-GT-02 and CAL-GT-04 crossplotted against the well logs, to find which attributes change with porosity and lithology once the common trend with depth is removed, and where the same attribute combinations occur along the line.
4. A SOM trained on a chosen combination of attributes and number of neurons.
5. SHAP values for that SOM, showing which attributes place samples where on the map, followed by further runs with other combinations.
6. The classes in the Someren area, where the only calibration is what was learned at the Californië end of the line.

## Stages

1. **Line and well.** The PreSTM full stack along the whole line (0–48.5 km, 0.15–3.0 s), with a default study window of 0–40 km and 0.15–2.0 s, and zoom views of the whole line, the Someren area and the Californië wells; dragging a box on the section zooms to it in distance and time. CAL-GT-04 is projected onto the line with its formation tops, horizons and formation shading; the Someren license crossing is marked with dashed lines. Buttons above the section switch each well, the karst zones and the formation names on and off in every stage; labels sit above the section. The seismic can be shown in grayscale with an impedance increase in black or white, or in red–white–blue; the data are zero phase and an increase in acoustic impedance is a negative number. Well control can be hidden.
2. **Geologic setting.** Structural domains along the line (Roer Valley Graben, Peel Boundary Fault zone, Peel and Venlo blocks), five geologic events that each outline, on a fixed view of the whole line, where they can be seen on SCAN029, formation groups shaded beside the wells, and an interpreted seismic line across the Californië wells from Doornenbal et al. (2019).
3. **Attributes.** Twenty-four attributes, each with a choice of color scale and a checkbox that keeps an attribute for the SOM while browsing, overlaid on the seismic with fixed color scales. Eighteen come from scan-lecture, including the amplitude of the full, near, mid and far stacks. Six are distance and quadrant (DQ) attributes computed in AASPI (DQ, ThetaPX, signed isochron, signed half isochron, and average and sum DQ over each half cycle), shown on their pamphlet color bars with unfilled DQ wiggles over the color and controls for wiggle amplitude and spacing.
4. **Logs and crossplots.** A well panel and a crossplot below a shorter section, for ASTEN-GT-02 or CAL-GT-04. The well panel shows the formations from the tops, the logs in 1 ms samples and averaged at each 4 ms attribute sample, and the attributes along the well path, with measured depth on the left and two-way time on the right. The crossplot shows either one attribute against one log, colored by formation, two-way time or another log, or two attributes with a log as the point color over the density of attribute combinations along the line. Axes are fixed for each quantity. Controls set the interval (the whole logged interval, one formation, or a group of adjacent units: the Someren to Boom members at ASTEN-GT-02, the Epen and Zeeland formations at CAL-GT-04), the log averaging window (4–62 ms) and removal of a straight-line trend with two-way time. Bars give the correlation coefficient of every attribute with the log for the same samples. With points colored by gamma ray class, a cutoff slider splits the samples into low and high gamma ray classes, the class of each sample is marked beside the formation column and the cutoff on the gamma ray track, and the bars give how far apart each attribute places the two classes, in pooled standard deviations. In the two-attribute view a polygon drawn on the crossplot marks every sample along the line with an attribute combination inside it. Moving over the well panel or the crossplot marks the same sample on the other panel and on the section. The bars are colored by what each attribute measures: waveform (stack amplitudes, relative acoustic impedance, AVT, quadrature trace, phase), envelope and energy, amplitude with angle, frequency, geometry and DQ. A tie shift slider moves the logs and tops up to 16 ms up or down against the seismic. Nine guided steps set up the lecture sequence: Zeeland against Epen at CAL-GT-04; the same samples with the trend with time removed; gamma ray classes from the Someren to the Boom members at ASTEN-GT-02; porosity over the whole ASTEN-GT-02 interval, then with the trend removed; the well tie; two attributes colored by class with a polygon; the attributes that separate the classes most, skipping near-duplicates, sent to Build a SOM; and the Houthem Formation, and a button adds the crossplot attributes to the SOM attribute list.
5. **Build a SOM.** Any combination of attributes and a SOM of 4 to 100 neurons, trained in the browser. The section is colored by each sample's neuron on a 2D color bar, the neuron grid shows how many samples each neuron holds, pairs of chosen attributes that correlate at 0.8 or more are listed, and every run is kept for comparison. Clicking a neuron on the grid switches its samples on or off on the section (shift-click shows one neuron alone), so a single facies can be followed along the line. 
6. **SHAP.** For the current run, how far each attribute moves samples across the map on average, and, for a clicked sample, the path from the average position to the sample's neuron built from each attribute's SHAP value.
7. **Refine and compare.** The attribute list again, so the set can be changed after reading the SHAP values and the SOM trained a second time in the same window, with the two runs shown side by side on one view of the line and their neuron grids below.
8. **Someren prospect.** The current SOM in the Someren area with ASTEN-GT-02 and its tops, and a depth scale from the migration velocities at the center of the license crossing.

## Running locally

The page fetches binary files, so it has to be served over http rather than opened as a file:

```
python -m http.server
```

then open `http://localhost:8000`.

## Rebuilding the data

Place these NLOG files in `raw/` (not committed):

- `L2EBN2020ASCAN029_PreSTM_final_full.sgy`
- `L2EBN2020ASCAN029_PreSTM_final_near.sgy`
- `L2EBN2020ASCAN029_PreSTM_final_far.sgy`
- `L2EBN2020ASCAN029_PreSTM_velocities_migration_ascii.txt`

plus `L2EBN2020ASCAN029_PreSTM_final_mid.sgy`, and the three attributes computed in AASPI on the whole line from 0 to 3 s, converted from VDS to NumPy arrays with `python vds_to_npy.py <file>.vds <file>.npy` (requires the `openvds` package) and placed in `raw/aaspi_0-3s/`: `relative_acoustic_impedance03.npy`, `rms_amplitude03.npy`, `avt03.npy`.

Then:

```
cd python
pip install -r requirements.txt
python build_data.py
```

| Step | Script | Output |
|---|---|---|
| 1 | `step1_read.py` | The whole line, 0–3 s, of the full, near, mid and far stacks with one time-only gain |
| 2 | `step2_well.py` | Well path and tops in two-way time; Someren target depth range in two-way time along the line |
| 3 | `step3_horizons.py` | Six horizons, 30–39 km |
| 4 | `step4_attributes.py` | Attributes on a 20 m grid, including the AASPI attributes |
| 6 | `step6_export.py` | `data/meta.json` and binary arrays |
| 6b | `step6b_dq.py` | the DQ attributes on the 4 ms attribute grid (`data/attr_dq*.bin`, `attr_theta_px.bin`, `attr_signed_*.bin`), DQ at 2 ms for the wiggles (`data/dq_wiggle.bin`), and their entries in `meta.json`; reads only the `data/` folder of the scan-dq repository (path in `DQ_DATA` in `python/config.py`) |
| 8 | `step8_logs.py` | `data/logs.json`: logs in two-way time and the attributes along each well path; runs from `data/` and the log files alone |

Well inputs are in `python/inputs/`: formation tops from NLOG, and deviation survey stations (a subset of the NLOG survey stations; the full survey can replace the file in the same column format). Log inputs are in `python/inputs/logs/`: the ASTEN-GT-02 composite (gamma ray, bulk density, density correction, neutron) and temperature log, the CAL-GT-04 gamma ray measured while drilling (LWD; Weatherford run from 815 m and Scientific Drilling run to 3021 m, joined at 1771 m) and mud-logging data (drilling time), and CAL-GT-04 temperature extracted from the cased-hole log `CAL-GT-04_CL_RDR.las` and resampled to 1 m. Step 8 needs only `data/meta.json`, `data/attr_*.bin` and these files, so after a change to the logs or tops it can be run on its own with `python step8_logs.py`.

## Methods and limitations

**Gain.** The PreSTM stacks have no gain applied after migration. One gain curve, the inverse of the smoothed median RMS amplitude at each time, is applied to every trace, so lateral amplitude differences are preserved.

**Wells.** Three wells are shown. ASTEN-GT-02 (AST-GT-02) is a vertical geothermal exploration well drilled by TNO in 1986–1987, inside the Someren license. Its tops follow the palynological revision in TNO report 2021 R10829 (Munsterman, 2021), taken as depths below the rotary table at 30.34 m above NAP, the reference of the 1987 logs. The revision removes the Heksenberg Formation, places the Someren Member (707–857 m) and Wintelre Member (857–1173 m) of the Veldhoven Formation where the 1987 report had the lower Breda Formation and Veldhoven Clay, moves the Voort Member top to 1173 m, and finds the whole Eocene missing at 1513 m, so the 1987 Basal Dongen Sand is the Reusel Member of the Landen Formation; the Houthem Formation top is at about 1635 m. The 1987 tops, from the TNO geological end-of-well report, are kept in `python/inputs/asten-02_tops_1987.csv`. The 1987 report lists the Breda Formation, the Voort Sand Member, the Basal Dongen Sand Member and the Houthem Formation as the intervals tested for geothermal use; the Voort, Reusel and Houthem units carry the candidate-reservoir asterisk, and the 1987 Breda Formation spans several units of the 2021 scheme and is named in the header note. Its NLOG location (RD 182010, 376840) projects to 12.5 km along the line, 95 m from it. It has no sonic log, so its tops and logs are placed in two-way time with the migration velocities; the Houthem Formation top falls at 1.51 s, on the strong reflector at the base of the Cenozoic section.

Two Californië wells are also shown. CAL-GT-04 (development well) is projected with its deviation survey. CAL-GT-01 (exploration well, sidetracked) has only its end-point offsets and vertical depth in NLOG, so its path is estimated as vertical to a kickoff at 642 m measured depth and straight to total depth; it lies 1.8–2.3 km from the line. CAL-GT-01 is the only one of the two with the Upper North Sea Group divided into formations (Breda Formation 56–336 m, Veldhoven Formation 336–526 m). Formation tops are from NLOG. The English NLOG pages translate two member names; the Dutch names Landen Clay Member and Heers Member are used here.

**Well tie.** CAL-GT-04 has no sonic log, density log or checkshot. Tops are converted to two-way time with Dix interval velocities from the PreSTM migration velocities, and the well path is projected to the nearest CDP using the deviation survey. The reservoir section of the well lies 0.9–1.3 km from the line. The depth scale on the right of the section is valid only at the well.

**DQ attributes.** The six DQ attributes come from the AASPI output in the scan-dq repository, on the same 20 m traces at 2 ms from 0.15 to 2.0 s; every second sample is kept on the 4 ms grid, with no averaging. They describe single half cycles of the near stack, where most other attributes are averaged over 62 ms, and they are in SEG normal polarity, the opposite of the seismic display. Below 2.0 s they have no values, and a SOM run that includes one is limited to 2.0 s. The StickOgram and quadrant number are not offered, since they are workflow steps and not rock measurements. The DQ workflow was published on siliciclastic sections, and the Chalk and the Dinantian carbonate on this line are outside those settings. No DQ code is in this repository.

**Logs and crossplots.** ASTEN-GT-02 gamma ray covers 450–1661 m and density and neutron 553–1638 m; the neutron values are in percent in the file and are divided by 100, and density samples with a density correction above 0.10 g/cm³ are removed. Density porosity uses a quartz matrix of 2.65 g/cm³ and water of 1.00 g/cm³. CAL-GT-04 has no open-hole wireline logs in the available data: gamma ray while drilling (from 792 m, below the Houthem Formation), drilling time and a cased-hole temperature log are used, and the well lies 0.5–1.4 km from the line. The Houthem Formation therefore has 26 m of gamma ray at ASTEN-GT-02, three samples at 4 ms, and only drilling time and temperature at CAL-GT-04. Logs are placed in two-way time along the well path with the Dix interval velocities and averaged into 1 ms samples; the page averages them again over a chosen window at each 4 ms attribute sample. Attribute values are read at the 20 m trace nearest the projected well path. Correlations are Pearson coefficients and are not computed for fewer than five samples. Consecutive samples are not independent, because most attributes are averaged over 62 ms. The CAL-GT-04 caliper and casing-inspection files on NLOG describe the casing and are not used, and the shallow ASTEN-GT-02 log (0–462 m, gamma ray in counts per second) is not used.

**Horizons.** Horizons follow local reflector dip from a structure tensor, starting at the reflection nearest each projected top. The Rupel Clay and Chalk tops are tracked from 30 to 39 km. Below the Chalk the reflectors are dipping and discontinuous and the tracker drifts across events, so the Zechstein, Epen, Zeeland and Bosscheveld tops are shown only within 1 km of the well tie. Dashed segments of the Zeeland top, and the whole Bosscheveld top, are placed at the time thickness measured at the well below the horizon above.

Interpreted horizons replace the automatic ones. Opening the page with `?pick` at the end of the address adds a pick panel to Line and wells: clicks add points to the selected horizon (optionally moved to the nearest trough or peak matching the horizon polarity within ±8 ms), shift-click removes the nearest point, and "Download picks" saves `horizon_picks.json`. Placing that file in `data/` makes the page use the picks, linearly interpolated between points, for every visitor.

**Someren license and target.** The license crossing (about 3.3–16.4 km) is read from the EBN/NLOG geothermal license map and is approximate (`SOMEREN_KM` in `config.py`). The developer states a target depth of 500–1500 m for medium-deep geothermal; that range is converted to two-way time with Dix interval velocities from the migration velocities at each velocity location. The target formation is not named in the published sources.

**Attributes.** Attributes are exported on a 20 m by 4 ms grid. Instantaneous phase, cosine of instantaneous phase and the quadrature trace are not averaged, because an average across the ±180° phase wrap has no physical meaning; phase is a cyclic quantity, so distances between phase values in a SOM do not follow the angular difference. The stack amplitudes (full, near, mid, far) are signed traces with the seismic time gain, averaged over 140 m along the line but not in time. Relative acoustic impedance, RMS amplitude and the amplitude volume transform were computed in AASPI; envelope, instantaneous frequency, sweetness, spectral ratio, apparent dip, dip variability, coherence and far minus near were computed in `step4_attributes.py`. The AASPI attributes RMS amplitude receives the same time-only gain as the seismic; relative acoustic impedance and AVT are each divided by their own median RMS at each time, because integration and phase rotation change how their amplitude varies with time. Relative acoustic impedance is multiplied by −1 because an increase in acoustic impedance is a negative number in this dataset. RMS amplitude and envelope correlate at 1.00 on this line, and sweetness correlates with both at 0.97–0.98, so only RMS amplitude is used in the SOM presets.

Attributes other than relative acoustic impedance and AVT are averaged over a 140 m by 62 ms window so they describe seismic facies character rather than individual reflections. Relative acoustic impedance and AVT are zero-mean band-limited traces, so they are averaged over the same 140 m laterally but only 10 ms vertically. Geometric attributes on a 2D line measure apparent dip along the line only. Instantaneous frequency and the spectral ratio decrease with travel time as higher frequencies are attenuated, so part of their variation follows depth. In the Carboniferous section the near and far stacks correlate at about 0.2, so the far minus near attribute contains a large noise component there.

**SOM.** The SOM (Kohonen, 1982) runs in a Web Worker (`js/som-worker.js`). The chosen attributes are converted to z-scores over the whole line, 0.15–3.0 s. Prototypes start on the plane of the first two principal components, which keeps the map orientation similar between runs, and are trained on 20,000 random samples with a Gaussian neighborhood that shrinks from half the map width to 0.5 neurons. A fixed random seed makes the same settings give the same map. Every sample is then assigned to its closest prototype. Neuron colors come from a 2D color bar, so neighboring neurons, which hold similar attribute combinations, have similar colors.

**SHAP.** The explained output is a sample's position on the SOM grid, which sets its color: the average grid position of all neurons, weighted by exp(−squared distance / τ), where τ is the median squared distance from a sample to its closest neuron. SHAP values (Lundberg and Lee, 2017) are estimated by sampling random attribute orderings, each with a randomly chosen training sample as the background (Štrumbelj and Kononenko, 2014): 8 orderings per sample for the 400 samples in the global importance, and 400 orderings for a clicked sample. The average position plus the SHAP values gives the sample's position. Attributes that correlate share credit, so each of several near-duplicate attributes can show a small SHAP value while together they have a large effect.

**Geologic setting.** Formation groups follow the scheme of Doornenbal et al. (2019, fig. 4): North Sea Supergroup (N), Chalk Group (CK), Zechstein and Lower Germanic Trias groups (ZE+RB), Limburg Group (DC), Carboniferous Limestone Group (CL) and Banjaard Group (OB); at ASTEN-GT-02 the North Sea Supergroup is divided into the Upper, Middle and Lower North Sea groups. The shading is drawn from each well's tops, 0.45 km either side of the well path, and is not an interpretation between wells. The position of the Peel Boundary Fault zone (about 16.5–18.5 km) is read from the section and is approximate. Structural and stratigraphic statements follow the DINOloket introduction to the Roer Valley Graben, van Lochem, ter Borgh and Mijnlieff (2019) and the ASTEN-GT-02 geological report (TNO, 1987). The figure in `img/doornenbal2019_fig4.png` is reproduced from Doornenbal et al. (2019) under CC BY 4.0; it shows line L2CAL2009A-2, not SCAN029.

## Data sources

- Geothermal licenses: Someren exploration license (Staatscourant 2020, 39740); target depth range from the developer as reported by Groenten & Fruit Actueel (January 2025).
- DQ attributes: computed in AASPI from the SCAN029 near and far stacks (scan-dq repository).
- Seismic: SCAN 2D line L2EBN2020ASCAN029, acquired 2020 and processed 2021 for EBN and TNO, available through NLOG (nlog.nl).
- Well: CAL-GT-04, Californië Lipzig Gielen Geothermie B.V., formation tops, deviation survey, LWD gamma ray, mud-logging data and cased-hole temperature log from NLOG.
- Well: ASTEN-GT-02, TNO, composite and temperature logs and the geological end-of-well report (1987) from NLOG; tops from TNO report 2021 R10829.

## References

- Becquey, M., M. Lavergne, and C. Willm, 1979, Acoustic impedance logs computed from seismic traces: Geophysics, 44, 1485–1501.
- Bakker, P., 2002, Image structure analysis for seismic interpretation: PhD thesis, Delft University of Technology.
- Bulhões, E. M., and W. N. Amorim, 2005, Princípio da SismoCamada Elementar e sua aplicação à Técnica Volume de Amplitudes (tecVA): 9th International Congress of the Brazilian Geophysical Society.
- Chopra, S., and K. J. Marfurt, 2007, Seismic attributes for prospect identification and reservoir characterization: SEG.
- Bedle, H., D. B. Neff, W. Neff, and D. Lubo-Robles, 2025a, Distance and quadrant trace method for quantitative seismic interpretation: Interpretation, 13, T163–T176.
- Bedle, H., D. B. Neff, W. Neff, and D. Lubo-Robles, 2025b, Prediction of reservoir properties using the RDQ crossplot workflow: Interpretation, doi: 10.1190/INT-2024-0096.1.
- Choudhry, N., H. Bedle, D. B. Neff, and W. Neff, 2026a, Isochron-based seismic attributes for stratigraphic and facies interpretation: field examples: IMAGE expanded abstract.
- Choudhry, N. ul H., H. Bedle, D. B. Neff, and W. Neff, 2026b, Plus or minus? Why the sign of an isochron could matter as much as its time thickness: AAPG Explorer, 47, no. 10, 6–10.
- Doornenbal, J. C., H. Kombrink, R. Bouroullec, et al., 2019, New insights on subsurface energy resources in the Southern North Sea Basin area: Geological Society, London, Special Publications, 494, 233–268, https://doi.org/10.1144/SP494-2018-178.
- Hart, B. S., 2008, Channel detection in 3-D seismic data using sweetness: AAPG Bulletin, 92, 733–742.
- van Lochem, H., M. ter Borgh, and H. Mijnlieff, 2019, Geological evaluation for the seismic acquisition programme for SCAN areas F (Oost-Brabant and Noord-Limburg) and G (Zuid-Limburg): SCAN report, EBN and TNO, nlog.nl.
- Kohonen, T., 1982, Self-organized formation of topologically correct feature maps: Biological Cybernetics, 43, 59–69.
- Munsterman, D. K., 2021, Lithostratigrafische update van resultaten op basis van eerder palynologisch onderzoek in boring Asten-GT-02 (AST-GT-02), interval 158–1532,07 m: TNO report 2021 R10829, Geologische Dienst Nederland.
- Lundberg, S. M., and S.-I. Lee, 2017, A unified approach to interpreting model predictions: Advances in Neural Information Processing Systems, 30, 4765–4774.
- Štrumbelj, E., and I. Kononenko, 2014, Explaining prediction models and individual predictions with feature contributions: Knowledge and Information Systems, 41, 647–665.
- Marfurt, K. J., R. L. Kirlin, S. L. Farmer, and M. S. Bahorich, 1998, 3-D seismic attributes using a semblance-based coherency algorithm: Geophysics, 63, 1150–1165.
- Partyka, G., J. Gridley, and J. Lopez, 1999, Interpretational applications of spectral decomposition in reservoir characterization: The Leading Edge, 18, 353–360.
- Radovich, B. J., and R. B. Oliveros, 1998, 3-D sequence interpretation of seismic instantaneous attributes from the Gorgon field: The Leading Edge, 17, 1286–1293.
- Randen, T., E. Monsen, C. Signer, A. Abrahamsen, J. O. Hansen, T. Sæter, and J. Schlaf, 2000, Three-dimensional texture attributes for seismic data analysis: SEG Technical Program Expanded Abstracts.
- Rutherford, S. R., and R. H. Williams, 1989, Amplitude-versus-offset variations in gas sands: Geophysics, 54, 680–688.
- Shuey, R. T., 1985, A simplification of the Zoeppritz equations: Geophysics, 50, 609–614.
- Taner, M. T., F. Koehler, and R. E. Sheriff, 1979, Complex seismic trace analysis: Geophysics, 44, 1041–1063.

## License

Content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Heather Bedle, University of Oklahoma (hbedle@ou.edu, ORCID 0000-0003-3010-0195).
