"""Step 6b: the distance and quadrant (DQ) attributes as attribute choices.

Input: the data/ folder of the scan-dq repository (path in DQ_DATA in config.py), which holds the DQ attributes
computed in AASPI from the SCAN029 near and far stacks, on every eighth CDP (20 m) at 2 ms from 0.150 to 1.998 s,
already scaled to 8 bits with their color bars and descriptions in its meta.json. The DQ calculation is not part of
this repository or of scan-dq; only the AASPI output is used.

The attribute grid here is the same 20 m traces at 4 ms from 0.150 to 3.000 s. Every 4 ms sample falls on a 2 ms
DQ sample, so each DQ attribute is written by taking every second sample, with no averaging along the line or in
time. Below 1.998 s there are no DQ values: the samples there are filled with the code nearest zero and the
attribute carries t_max in meta.json, which the page uses to leave them out of displays, crossplots and the SOM.

DQ itself is also copied at 2 ms (data/dq_wiggle.bin) for the unfilled wiggle traces drawn over the color display.
"""
import json, shutil
import numpy as np
import config as C

KEEP = {   # scan-dq key -> attribute family on this page; the StickOgram and quadrant number are picks, not rock measurements
    "dq": "DQ", "theta_px": "DQ", "dq_layer_average": "DQ layer attributes", "dq_layer_sum": "DQ layer attributes",
    "signed_isochron": "DQ isochrons", "signed_half_isochron": "DQ isochrons",
}


def main():
    src = json.load(open(C.DQ_DATA / "meta.json"))
    meta = json.load(open(C.DATA / "meta.json"))
    g, dg = meta["grid"], src["dq_grid"]
    assert g["nx"] == dg["nx"] and abs(g["km_max"] - dg["km_max"]) < 1e-6, "scan-dq and this repository must share the 20 m trace grid"
    step = int(round(g["dt"] / dg["dt"]))                       # 2
    t_max = dg["t_min"] + (dg["nt"] - 1) * dg["dt"]             # 1.998 s
    n_in = int(np.floor((t_max - meta["t_min"]) / g["dt"] + 1e-6)) + 1   # 4 ms samples with DQ values
    for k, fam in KEEP.items():
        a = src["dq"][k]
        v = np.fromfile(C.DQ_DATA / f"dq_{k}.bin", np.uint8).reshape(dg["nx"], dg["nt"])
        zero = int(np.clip(np.round(-a["min"] / (a["max"] - a["min"]) * 255), 0, 255))
        out = np.full((g["nx"], g["nt"]), zero, np.uint8)
        out[:, :n_in] = v[:, ::step][:, :n_in]
        out.tofile(C.DATA / f"attr_{k}.bin")
        meta["attributes"][k] = dict(label=a["label"], unit=a["unit"], family=fam, measures=a["measures"], geology=a["geology"],
                                     source=a["source"], min=a["min"], max=a["max"], lut=a["lut"], cmap="dq",
                                     t_max=round(meta["t_min"] + (n_in - 1) * g["dt"], 4), dq=True)
        print(f"{k}: {n_in} of {g['nt']} samples, {a['min']} to {a['max']} {a['unit']}")
    shutil.copyfile(C.DQ_DATA / "dq_dq.bin", C.DATA / "dq_wiggle.bin")
    a = src["dq"]["dq"]
    meta["dq_wiggle"] = dict(file="dq_wiggle.bin", nx=dg["nx"], nt=dg["nt"], dt=dg["dt"], t_min=dg["t_min"], min=a["min"], max=a["max"])
    json.dump(meta, open(C.DATA / "meta.json", "w"), separators=(",", ":"))


if __name__ == "__main__":
    main()
