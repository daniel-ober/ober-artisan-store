import React, { useState } from "react";
import { db, storage, app } from "../firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import "./EndorsementForm.css";

const initial = {
  fullName: "",
  stageName: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  bands: "",
  website: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  tourSchedule: "",
  currentGear: "",
  endorsementGoals: "",
  mediaLinks: "",
  whyOber: "",
  tierInterest: "Rising Artist",
  heardAboutUs: "",
  agree: false,
};

export default function EndorsementForm() {
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null); // optional EPK/press kit
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.agree)
      return "Please confirm you agree to represent the Ober brand respectfully.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    // Optional: mirror Storage rule (10 MB max)
    if (file && file.size > 10 * 1024 * 1024) {
      setError("File is larger than 10 MB. Please upload a smaller file.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) Create Firestore doc
      const colRef = collection(db, "endorsement_applications");
      const payload = {
        ...form,
        createdAt: serverTimestamp(),
        status: "new", // new | under_review | approved | declined
        source: "website",
        hasAttachment: !!file,
      };
      const docRef = await addDoc(colRef, payload);

      // 2) Optional upload (EPK / resume / press kit)
      let uploadedFile = null;
      if (file) {
        const path = `endorsement_applications/${docRef.id}/uploads/${file.name}`;
        const fileRef = ref(storage, path);
        // pass contentType so Storage rules that check MIME match
        await uploadBytes(fileRef, file, { contentType: file.type || undefined });
        const url = await getDownloadURL(fileRef);
        uploadedFile = { name: file.name, size: file.size, url, path, contentType: file.type || "" };
        await updateDoc(doc(db, "endorsement_applications", docRef.id), {
          attachment: uploadedFile,
        });
      }

      // 3) Trigger auto-reply email (best-effort; do not block success UI)
      try {
        const functions = getFunctions(app, "us-central1"); // ensure region matches deploy
        const sendAutoReply = httpsCallable(functions, "sendEndorsementAutoReply");
        await sendAutoReply({
          docId: docRef.id,
          toEmail: form.email,
          fullName: form.fullName,
          stageName: form.stageName,
          tierInterest: form.tierInterest,
        });
      } catch (mailErr) {
        console.warn(
          "[endorsement] email send failed:",
          mailErr?.code,
          mailErr?.message || mailErr
        );
      }

      // Success UI
      setSuccessOpen(true);
      setForm(initial);
      setFile(null);
    } catch (e2) {
      console.error("[endorsement submit] error", e2?.code, e2?.message, e2);
      setError(
        e2?.message ||
          "Something went wrong submitting your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="endorsement-form-wrapper">
      <form onSubmit={onSubmit} className="endorsement-form">
        <h3>Artist Endorsement Application</h3>
        <p className="form-subcopy">
          We’re honored you want to represent the Ober brand. Please complete
          the form below—our team will review and follow up via email.
        </p>

        {error && <div className="error">{error}</div>}

        <div className="grid-2">
          <label>
            Full Name*
            <input name="fullName" value={form.fullName} onChange={onChange} required />
          </label>
          <label>
            Stage Name
            <input name="stageName" value={form.stageName} onChange={onChange} />
          </label>
        </div>

        <div className="grid-2">
          <label>
            Email*
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={onChange} />
          </label>
        </div>

        <div className="grid-2">
          <label>
            City
            <input name="city" value={form.city} onChange={onChange} />
          </label>
          <label>
            Country
            <input name="country" value={form.country} onChange={onChange} />
          </label>
        </div>

        <div className="grid-2">
          <label>
            Band(s) / Act(s)
            <input name="bands" value={form.bands} onChange={onChange} />
          </label>
          <label>
            Website
            <input name="website" value={form.website} onChange={onChange} />
          </label>
        </div>

        <div className="grid-3">
          <label>
            Instagram
            <input name="instagram" value={form.instagram} onChange={onChange} placeholder="@handle or URL" />
          </label>
          <label>
            YouTube
            <input name="youtube" value={form.youtube} onChange={onChange} placeholder="Channel or URL" />
          </label>
          <label>
            TikTok
            <input name="tiktok" value={form.tiktok} onChange={onChange} placeholder="@handle or URL" />
          </label>
        </div>

        <label>
          Touring Schedule / Recent Gigs
          <textarea name="tourSchedule" value={form.tourSchedule} onChange={onChange} rows={3} />
        </label>

        <label>
          Gear You Currently Use
          <textarea name="currentGear" value={form.currentGear} onChange={onChange} rows={3} />
        </label>

        <label>
          Endorsement Goals (what are you looking for?)
          <textarea name="endorsementGoals" value={form.endorsementGoals} onChange={onChange} rows={3} />
        </label>

        <label>
          Media Links (photos, videos, press) — comma separated
          <textarea name="mediaLinks" value={form.mediaLinks} onChange={onChange} rows={2} />
        </label>

        <label>
          Why Ober Artisan Drums?
          <textarea name="whyOber" value={form.whyOber} onChange={onChange} rows={3} />
        </label>

        <div className="grid-2">
          <label>
            Tier Interest
            <select name="tierInterest" value={form.tierInterest} onChange={onChange}>
              <option>Rising Artist</option>
              <option>Featured Artist</option>
              <option>Prestige Artist</option>
            </select>
          </label>

          <label>
            How did you hear about us?
            <input
              name="heardAboutUs"
              value={form.heardAboutUs}
              onChange={onChange}
              placeholder="Tour, referral, ad, etc."
            />
          </label>
        </div>

        <label className="file-label">
          Optional: Upload one file (EPK / press kit / resume)
          <input
            type="file"
            accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <label className="agree">
          <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} />
          I agree to represent the Ober Artisan Drums brand professionally and respectfully. I
          understand Ober supports full creative freedom and does not require exclusivity.
        </label>

        <button className="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Application"}
        </button>

        {successOpen && (
          <div className="modal">
            <div className="modal-card">
              <h4>Thanks for your interest!</h4>
              <p>
                Your application has been received. Please check your email for a confirmation note
                outlining next steps. Our typical review turnaround is{" "}
                <strong>5–10 business days</strong>.
              </p>
              <button onClick={() => setSuccessOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}