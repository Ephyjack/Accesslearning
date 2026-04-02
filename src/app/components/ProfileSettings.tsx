import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { X, Save, Plus, Trash2, Award, Briefcase, User, GraduationCap, Video } from "lucide-react";

export function ProfileSettings({ profile, onUpdate, onClose }: { profile: any, onUpdate: (p: any) => void, onClose: () => void }) {
  const [headline, setHeadline] = useState(profile?.headline || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [school, setSchool] = useState(profile?.school || "");

  const [certifications, setCertifications] = useState<any[]>(profile?.certifications || []);
  const [platforms, setPlatforms] = useState<any[]>(profile?.external_platforms || []);
  const [socials, setSocials] = useState<any>(profile?.social_links || { linkedin: "", twitter: "", website: "" });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      headline,
      bio,
      school,
      certifications,
      external_platforms: platforms,
      social_links: socials,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id)
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      onUpdate(data);
      onClose();
    } else {
      alert("Failed to update profile: " + error?.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Edit Public Profile (Resume)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Professional Tagline</label>
              <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Senior CS Educator at Havard" className="w-full px-4 py-2 rounded-xl border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">About Me (Bio)</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell students about your background..." className="w-full px-4 py-2 rounded-xl border text-sm" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-violet-500" /> Social Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <input value={socials.linkedin || ""} onChange={e => setSocials({ ...socials, linkedin: e.target.value })} placeholder="LinkedIn URL" className="px-4 py-2 rounded-xl border text-sm" />
              <input value={socials.twitter || ""} onChange={e => setSocials({ ...socials, twitter: e.target.value })} placeholder="X (Twitter) URL" className="px-4 py-2 rounded-xl border text-sm" />
              <input value={socials.website || ""} onChange={e => setSocials({ ...socials, website: e.target.value })} placeholder="Personal Website" className="px-4 py-2 rounded-xl border text-sm col-span-2" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Certifications & Degrees */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Degrees & Certifications</h3>
              <button onClick={() => setCertifications([...certifications, { title: "", issuer: "", year: "" }])} className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">+ Add New</button>
            </div>
            {certifications.map((cert, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                <input value={cert.title} onChange={e => { const n = [...certifications]; n[idx].title = e.target.value; setCertifications(n); }} placeholder="Degree (e.g. MSc Computer Science)" className="flex-1 px-3 py-1.5 rounded-lg border text-xs" />
                <input value={cert.issuer} onChange={e => { const n = [...certifications]; n[idx].issuer = e.target.value; setCertifications(n); }} placeholder="Issuer/University" className="w-1/3 px-3 py-1.5 rounded-lg border text-xs" />
                <input value={cert.year} onChange={e => { const n = [...certifications]; n[idx].year = e.target.value; setCertifications(n); }} placeholder="Year" className="w-20 px-3 py-1.5 rounded-lg border text-xs" />
                <button onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* External platforms */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-500" /> External Courses (Udemy, YouTube)</h3>
              <button onClick={() => setPlatforms([...platforms, { title: "", url: "", type: "coursera" }])} className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+ Add Course Link</button>
            </div>
            {platforms.map((plat, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                <select value={plat.type} onChange={e => { const n = [...platforms]; n[idx].type = e.target.value; setPlatforms(n); }} className="px-3 py-1.5 rounded-lg border text-xs bg-white">
                  <option value="linkedin">LinkedIn Learning</option>
                  <option value="coursera">Coursera</option>
                  <option value="udemy">Udemy</option>
                  <option value="youtube">YouTube Playlist</option>
                  <option value="other">Other Website</option>
                </select>
                <input value={plat.title} onChange={e => { const n = [...platforms]; n[idx].title = e.target.value; setPlatforms(n); }} placeholder="Course Name" className="flex-1 px-3 py-1.5 rounded-lg border text-xs" />
                <input value={plat.url} onChange={e => { const n = [...platforms]; n[idx].url = e.target.value; setPlatforms(n); }} placeholder="URL Link" className="flex-1 px-3 py-1.5 rounded-lg border text-xs" />
                <button onClick={() => setPlatforms(platforms.filter((_, i) => i !== idx))} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-white text-gray-700">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-violet-600 text-white hover:bg-violet-700 flex items-center gap-2">
            {saving ? <span className="animate-spin text-white">⟳</span> : <Save className="w-4 h-4" />}
            Save Resume Profile
          </button>
        </div>
      </div>
    </div>
  );
}
