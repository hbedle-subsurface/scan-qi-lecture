"""Step 8: well logs in two-way time, and every attribute along each well path, for the crossplot stage.

Inputs (python/inputs/logs/, from NLOG):
  ast-gt-02_composite.las    ASTEN-GT-02 gamma ray, bulk density, density correction, neutron (TNO composite, depths below rotary table)
  ast-gt-02_temperature.las  ASTEN-GT-02 temperature log (1987)
  cal-gt-04_lwd_gr_run1_weatherford.las   CAL-GT-04 gamma ray while drilling (LWD), Weatherford run, 815-1774 m, Dec 2015
  cal-gt-04_lwd_gr_run2_scientific.las    CAL-GT-04 gamma ray while drilling (LWD), Scientific Drilling run, 1770-3021 m, Jan 2016
  cal-gt-04_mudlog.las       CAL-GT-04 drilling time (mud-logging data, 2015-2016)
  cal-gt-04_temperature.csv  CAL-GT-04 temperature from the cased-hole log CAL-GT-04_CL_RDR.las, resampled to 1 m

Logs are placed in two-way time with the well path from step 2 (measured depth to two-way time from the Dix interval
velocities of the migration velocities), then averaged into 1 ms samples. The web page averages the 1 ms logs again
into the 4 ms attribute samples with a window chosen on the page.

The attribute values along each well are read from the exported attribute files (data/attr_*.bin) at the CDP nearest the
projected well path at each two-way time, so this step runs from the files in data/ and needs no SEG-Y.
"""
import csv, json
import numpy as np
import config as C

LOGS = C.INPUTS / "logs"
DT_LOG = 0.001
DRHO_MAX = 0.10
LWD_JOIN = 1771.0        # CAL-GT-04: depth where the second LWD gamma ray run takes over from the first          # density samples with a larger density correction are treated as bad hole
RHO_MATRIX, RHO_FLUID = 2.65, 1.00

# colors for units in the logged intervals: sands yellow to orange, clays and shales green-gray to blue,
# carbonates pink to purple, evaporites violet
UNIT_COLORS = {
    "Groote Heide Formation": "#e9c46a", "Someren Member": "#f4a261", "Wintelre Member": "#8ab17d", "Voort Member": "#e76f51",
    "Steensel Member": "#c9b27c", "Boom Member": "#5e7c8a", "Berg Member": "#f6bd60", "Reusel Member": "#d62828",
    "Liessel Member": "#6d8f9e", "Gelinden Member": "#a3b18a", "Orp Member": "#fcbf49", "Swalmen Member": "#9c8b7a",
    "Houthem Formation": "#c77dff",
    "Upper North Sea Group": "#d9c9a3", "Veldhoven Clay Member": "#8ab17d", "Rupel Clay Member": "#5e7c8a", "Vessem Member": "#f6bd60",
    "Landen Clay Member": "#6d8f9e", "Heers Member": "#fcbf49",
    "Maastricht Formation": "#e0aaff", "Nederweert Sandstone Member": "#f4a261", "Zechstein Upper Claystone Formation": "#8d99ae",
    "Z3 (Leine) Formation": "#9d4edd", "Z2 (Stassfurt) Formation": "#7b2cbf", "Epen Formation": "#4a6fa5",
    "Geverik Member": "#264653", "Zeeland Formation": "#ff5d8f", "Bosscheveld Formation": "#b5838d", "Farne Group": "#6c757d",
}
TARGETS = {"ASTEN-GT-02": {"Voort Member", "Reusel Member", "Houthem Formation"}, "CAL-GT-04": {"Zeeland Formation", "Houthem Formation"}}


def read_las(path, null):
    lines = open(path, encoding="latin1").read().splitlines()
    i = next(k for k, l in enumerate(lines) if l.strip().upper().startswith("~A"))
    a = np.array([[float(x) for x in l.split()] for l in lines[i + 1:] if l.strip()])
    a[np.isclose(a, null)] = np.nan
    return a[np.argsort(a[:, 0])]


def to_time(md_log, values, md_path, twt_path, t_grid):
    """Average log samples into 1 ms two-way-time samples along the well path."""
    ok = ~np.isnan(values)
    md_edges = np.interp(np.r_[t_grid - DT_LOG / 2, t_grid[-1] + DT_LOG / 2], twt_path, md_path)
    out = np.full(len(t_grid), np.nan)
    z, v = md_log[ok], values[ok]
    lo, hi = np.searchsorted(z, md_edges[:-1]), np.searchsorted(z, md_edges[1:])
    cs = np.r_[0, np.cumsum(v)]
    n = hi - lo
    out[n > 0] = (cs[hi] - cs[lo])[n > 0] / n[n > 0]
    return out


def curve(label, unit, lo, hi, values, note=""):
    return dict(label=label, unit=unit, min=lo, max=hi, note=note,
                values=[None if np.isnan(x) else round(float(x), 4) for x in values])


def main():
    meta = json.load(open(C.DATA / "meta.json"))
    g = meta["grid"]
    tg = meta["t_min"] + np.arange(g["nt"]) * g["dt"]
    wells = {w["name"]: w for w in meta["wells"]}
    attrs = {k: np.fromfile(C.DATA / f"attr_{k}.bin", np.uint8).reshape(g["nx"], g["nt"]) for k in meta["attributes"]}
    out = []

    for name in ["ASTEN-GT-02", "CAL-GT-04"]:
        w = wells[name]
        md_p = np.array([p["md"] for p in w["path"]]); tw_p = np.array([p["twt"] for p in w["path"]])
        km_p = np.array([p["km"] for p in w["path"]]); off_p = np.array([p["offset_m"] for p in w["path"]])
        keep = np.r_[True, np.diff(tw_p) > 0]           # two-way time increasing with depth
        md_p, tw_p, km_p, off_p = md_p[keep], tw_p[keep], km_p[keep], off_p[keep]

        curves = {}
        if name == "ASTEN-GT-02":
            a = read_las(LOGS / "ast-gt-02_composite.las", -999.25)
            z, gr, rho, drho, nphi = a[:, 0], a[:, 1], a[:, 2], a[:, 3], a[:, 4] / 100   # neutron is in percent in this file
            rho = np.where(np.abs(drho) > DRHO_MAX, np.nan, rho)
            tmp = read_las(LOGS / "ast-gt-02_temperature.las", -999999.0)
            md_range = (z[~np.isnan(gr)].min(), z[~np.isnan(gr)].max())
            t_log = np.arange(np.interp(md_range[0], md_p, tw_p), np.interp(md_range[1], md_p, tw_p), DT_LOG).round(4)
            curves["GR"] = curve("Gamma ray", "API", 0, 200, to_time(z, gr, md_p, tw_p, t_log))
            curves["RHOB"] = curve("Bulk density", "g/cm³", 1.8, 2.8, to_time(z, rho, md_p, tw_p, t_log),
                                   f"Samples with a density correction above {DRHO_MAX} g/cm³ removed as bad hole.")
            curves["PHID"] = curve("Density porosity", "v/v", 0, 0.6, to_time(z, (RHO_MATRIX - rho) / (RHO_MATRIX - RHO_FLUID), md_p, tw_p, t_log),
                                   f"From bulk density with a quartz matrix of {RHO_MATRIX} g/cm³ and water of {RHO_FLUID} g/cm³.")
            curves["NPHI"] = curve("Neutron porosity", "v/v", 0, 0.6, to_time(z, nphi, md_p, tw_p, t_log))
            curves["TEMP"] = curve("Temperature", "°C", 0, 100, to_time(tmp[:, 0], tmp[:, 1], md_p, tw_p, t_log))
        else:
            a = read_las(LOGS / "cal-gt-04_mudlog.las", -999.25)
            z, rop = a[:, 0], a[:, 1]
            # gamma ray from the two LWD runs, joined at 1771 m where the second run begins reading formation
            r1 = read_las(LOGS / "cal-gt-04_lwd_gr_run1_weatherford.las", -999.25)   # columns DEPT, ROP, HAGRT
            r2 = read_las(LOGS / "cal-gt-04_lwd_gr_run2_scientific.las", -999.25)    # columns DEPT, GRRT, ROP, T-TEMP
            k1, k2 = r1[:, 0] < LWD_JOIN, r2[:, 0] >= LWD_JOIN
            zg = np.r_[r1[k1, 0], r2[k2, 0]]; grv = np.r_[r1[k1, 2], r2[k2, 1]]
            order = np.argsort(zg); zg, grv = zg[order], grv[order]
            tmp = np.loadtxt(LOGS / "cal-gt-04_temperature.csv", delimiter=",", skiprows=3)
            md_range = (300.0, zg[~np.isnan(grv)].max())   # from the Veldhoven Clay, so the Cenozoic tops and drilling time are shown
            t_log = np.arange(np.interp(md_range[0], md_p, tw_p), np.interp(md_range[1], md_p, tw_p), DT_LOG).round(4)
            curves["GR"] = curve("Gamma ray", "API", 0, 200, to_time(zg, grv, md_p, tw_p, t_log),
                                 "Gamma ray while drilling (LWD): Weatherford run to 1771 m, Scientific Drilling run below.")
            curves["DRILL"] = curve("Drilling time", "min/m", 0, 50, to_time(z, rop, md_p, tw_p, t_log),
                                    "Minutes to drill one meter: a drilling parameter that also depends on the bit, weight on bit and rotation speed.")
            curves["TEMP"] = curve("Temperature", "°C", 0, 100, to_time(tmp[:, 0], tmp[:, 1], md_p, tw_p, t_log),
                                   "Cased-hole log run shortly after drilling, so not at equilibrium temperature.")

        # attribute samples along the well path (4 ms grid)
        j_in = np.where((tg >= t_log[0]) & (tg <= t_log[-1]))[0]
        km_j = np.interp(tg[j_in], tw_p, km_p)
        i_j = np.clip(np.round((km_j - g["km_min"]) / (g["dx_m"] / 1000)).astype(int), 0, g["nx"] - 1)
        att = {}
        for k, A in meta["attributes"].items():
            q = attrs[k][i_j, j_in].astype(float)
            ok = tg[j_in] <= A.get("t_max", 99) + 1e-6       # DQ attributes stop at 1.998 s
            att[k] = [round(float(A["min"] + v / 255 * (A["max"] - A["min"])), 4) if o else None for v, o in zip(q, ok)]

        tops = sorted([t for t in w["tops"]], key=lambda t: t["md"])
        units = []
        for i, t in enumerate(tops):
            base_md = tops[i + 1]["md"] if i + 1 < len(tops) else float(md_p[-1])
            top_t, base_t = float(np.interp(t["md"], md_p, tw_p)), float(np.interp(base_md, md_p, tw_p))
            if base_t < t_log[0] or top_t > t_log[-1]: continue
            units.append(dict(name=t["unit"], top_md=t["md"], base_md=base_md, top_twt=round(top_t, 4), base_twt=round(base_t, 4),
                              color=UNIT_COLORS.get(t["unit"], "#999999"), target=t["unit"] in TARGETS.get(name, set())))

        depth_ticks = [dict(md=int(d), twt=round(float(np.interp(d, md_p, tw_p)), 4)) for d in range(0, 3100, 100)
                       if d <= md_p[-1] and t_log[0] - 0.05 <= np.interp(d, md_p, tw_p) <= t_log[-1] + 0.05]
        out.append(dict(name=name, t0=float(t_log[0]), dt=DT_LOG, n=len(t_log), curves=curves, units=units, depth_ticks=depth_ticks,
                        grid=dict(j=[int(j) for j in j_in], km=[round(float(k), 4) for k in km_j],
                                  offset_m=[int(round(float(o))) for o in np.interp(tg[j_in], tw_p, off_p)], attrs=att),
                        md_range=[float(md_range[0]), float(md_range[1])]))
        print(f"{name}: {t_log[0]:.3f}-{t_log[-1]:.3f} s, {len(j_in)} attribute samples, units: {', '.join(u['name'] for u in units)}")

    json.dump(dict(wells=out), open(C.DATA / "logs.json", "w"), separators=(",", ":"), ensure_ascii=False)


if __name__ == "__main__":
    main()
