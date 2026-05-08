"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, ADMIN_UID } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface TradingRule {
  id: string;
  text: string;
  subRules: string[];
}

const DEFAULT_RULES: TradingRule[] = [
  { id: "default_01", text: "Check news and write down red folder events before checking charts.", subRules: [] },
  { id: "default_02", text: "Determine Daily Bias", subRules: [] },
  { id: "default_03", text: "Valid pairs: EURUSD | GBPUSD | XAUUSD | XAGUSD", subRules: [] },
  { id: "default_04", text: "Must be trading after TDO", subRules: [
    "If above TDO and bias is bearish -> shorts.",
    "If below TDO and bias is bullish -> longs."
  ]},
  { id: "default_05", text: "Must be in an iFVG in the same timeframe we are trading from.", subRules: [] },
  { id: "default_06", text: "HP iFVG is one that has broken structure.", subRules: [] },
  { id: "default_07", text: "Wait for a PSP / very clear SSMT before entering a trade.", subRules: [] },
];

export default function AccessSettings() {
  const router = useRouter();
  const [visibility, setVisibility] = useState<"public" | "private" | "invite-only">("private");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Trading Rules state
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  const [editingSubRuleFor, setEditingSubRuleFor] = useState<string | null>(null);
  const [newSubRuleText, setNewSubRuleText] = useState("");

  // Debounce timer ref for auto-saving rules
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth Guard & Fetch Existing Settings
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.visibility) setVisibility(data.visibility);
            if (data.invitedEmails) setInvitedEmails(data.invitedEmails);
            if (data.tradingRules && data.tradingRules.length > 0) {
              setTradingRules(data.tradingRules);
            } else {
              // Pre-populate with default rules for first-time users
              setTradingRules(DEFAULT_RULES);
            }
          } else {
            // No user doc at all — set defaults
            setTradingRules(DEFAULT_RULES);
          }
          setRulesLoaded(true);
        } catch (error) {
          console.error("Failed to fetch settings:", error);
          setTradingRules(DEFAULT_RULES);
          setRulesLoaded(true);
        }
      }
    });
    return () => unsub();
  }, [router]);

  // Save Settings to Database
  const saveAccessSettings = async (newVis: string, emails: string[]) => {
    if (!auth.currentUser) return;
    setIsSavingAccess(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { 
        visibility: newVis,
        invitedEmails: emails,
        traderEmail: auth.currentUser.email
      }, { merge: true });
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("ERROR: Failed to save privacy settings.");
    } finally {
      setIsSavingAccess(false);
    }
  };

  // Save rules to Firestore (debounced)
  const saveRules = useCallback((rules: TradingRule[]) => {
    if (!auth.currentUser) return;
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setIsSavingRules(true);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", auth.currentUser!.uid), {
          tradingRules: rules,
        }, { merge: true });
      } catch (error) {
        console.error("Failed to save rules:", error);
      } finally {
        setIsSavingRules(false);
      }
    }, 600);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const updateRules = (newRules: TradingRule[]) => {
    setTradingRules(newRules);
    saveRules(newRules);
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVis = e.target.value as "public" | "private" | "invite-only";
    setVisibility(newVis);
    saveAccessSettings(newVis, invitedEmails);
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail && !invitedEmails.includes(newEmail.toLowerCase())) {
      const updatedList = [...invitedEmails, newEmail.toLowerCase()];
      setInvitedEmails(updatedList);
      saveAccessSettings(visibility, updatedList);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updatedList = invitedEmails.filter(email => email !== emailToRemove);
    setInvitedEmails(updatedList);
    saveAccessSettings(visibility, updatedList);
  };

  // --- Trading Rules handlers ---

  const addRule = () => {
    const newRule: TradingRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: "",
      subRules: [],
    };
    updateRules([...tradingRules, newRule]);
  };

  const removeRule = (ruleId: string) => {
    updateRules(tradingRules.filter(r => r.id !== ruleId));
  };

  const updateRuleText = (ruleId: string, text: string) => {
    updateRules(tradingRules.map(r => r.id === ruleId ? { ...r, text } : r));
  };

  const moveRule = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tradingRules.length) return;
    const newRules = [...tradingRules];
    [newRules[index], newRules[newIndex]] = [newRules[newIndex], newRules[index]];
    updateRules(newRules);
  };

  const addSubRule = (ruleId: string) => {
    if (!newSubRuleText.trim()) return;
    updateRules(tradingRules.map(r => 
      r.id === ruleId 
        ? { ...r, subRules: [...r.subRules, newSubRuleText.trim()] } 
        : r
    ));
    setNewSubRuleText("");
    setEditingSubRuleFor(null);
  };

  const removeSubRule = (ruleId: string, subIndex: number) => {
    updateRules(tradingRules.map(r => 
      r.id === ruleId 
        ? { ...r, subRules: r.subRules.filter((_, i) => i !== subIndex) } 
        : r
    ));
  };

  const updateSubRuleText = (ruleId: string, subIndex: number, text: string) => {
    updateRules(tradingRules.map(r => 
      r.id === ruleId 
        ? { ...r, subRules: r.subRules.map((s, i) => i === subIndex ? text : s) } 
        : r
    ));
  };

  return (
    <div className="min-h-screen bg-beige-retro text-brown-dark p-6 md:p-12 font-mono ">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Header */}
        <header className="border-b-4 border-brown-dark pb-4 flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase">nfx // Access_Control</h1>
          </div>
          <button 
            type="button" onClick={() => router.push("/")} 
            className="w-fit text-[10px] font-black bg-beige-retro text-brown-dark px-3 py-1 uppercase border-2 border-brown-dark hover:bg-brown-dark hover:text-beige-retro cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
          >
            {"< RETURN_TO_FEED"}
          </button>
        </header>

        {/* Settings Panel */}
        <div className="border-2 border-brown-dark bg-beige-muted p-8 shadow-[8px_8px_0px_0px_rgba(74,55,33,1)]">
          <div className="flex justify-between items-center mb-8 border-b-2 border-brown-dark pb-4">
            <h2 className="text-xl font-black uppercase tracking-widest">// Journal_Visibility_Settings</h2>
            {isSavingAccess && <span className="text-xs font-black uppercase bg-brown-dark text-beige-retro px-2 py-1 animate-pulse">SYNCING...</span>}
          </div>
          
          <div className="flex flex-col gap-8">
            {/* Global Access Level */}
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-brown-medium">Global_Access_Level</label>
              <select 
                value={visibility}
                onChange={handleVisibilityChange}
                className="w-full bg-beige-retro border-2 border-brown-dark p-4 text-sm font-black uppercase outline-none focus:bg-white cursor-pointer transition-colors"
              >
                <option value="private">PRIVATE (Only You)</option>
                <option value="public">PUBLIC (Anyone can view)</option>
                <option value="invite-only">INVITE ONLY (Whitelisted Google Accounts)</option>
              </select>
              
              <div className="bg-beige-retro p-4 border border-brown-light text-xs leading-relaxed font-mono mt-4">
                <span className="block text-brown-medium font-black mb-2 uppercase tracking-[0.2em]">// Status_Message</span>
                {visibility === "public" && "WARNING: Your journal feed is visible to anyone."}
                {visibility === "private" && "SECURE: Only you can access your journal records."}
                {visibility === "invite-only" && "RESTRICTED: Only verified emails below can access."}
              </div>
            </div>

            {/* Email Whitelist */}
            {visibility === "invite-only" && (
              <div className="border-t-4 border-dashed border-brown-light pt-8 space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-brown-medium">Authorized_Viewer_Emails</label>
                <form onSubmit={handleAddEmail} className="flex gap-2">
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="add_google_email@gmail.com"
                    className="w-full bg-beige-retro border-2 border-brown-dark p-3 text-sm font-bold outline-none focus:bg-white"
                  />
                  <button 
                    type="submit"
                    className="bg-brown-dark text-beige-retro px-6 py-3 border-2 border-brown-dark text-sm font-black hover:bg-brown-medium cursor-pointer transition-colors"
                  >
                    AUTHORIZE
                  </button>
                </form>
                
                <div className="bg-beige-retro border-2 border-brown-dark min-h-[150px] p-4 max-h-[300px] overflow-y-auto">
                  {invitedEmails.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-brown-medium/50 uppercase font-black">
                      NO_ACCOUNTS_AUTHORIZED
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invitedEmails.map(email => (
                        <div key={email} className="flex justify-between items-center border-2 border-brown-dark bg-beige-muted p-3">
                          <span className="text-xs font-black uppercase">{email}</span>
                          <button 
                            type="button" onClick={() => handleRemoveEmail(email)}
                            className="text-red-800 text-[10px] bg-beige-retro px-3 py-1 border-2 border-red-800 font-black hover:bg-red-800 hover:text-beige-retro transition-colors cursor-pointer"
                          >
                            [REVOKE]
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================ */}
        {/* Trading Rules Panel */}
        {/* ================================================ */}
        <div className="border-2 border-brown-dark bg-beige-muted p-8 shadow-[8px_8px_0px_0px_rgba(74,55,33,1)]">
          <div className="flex justify-between items-center mb-8 border-b-2 border-brown-dark pb-4">
            <h2 className="text-xl font-black uppercase tracking-widest">// Trading_Rules</h2>
            {isSavingRules && <span className="text-xs font-black uppercase bg-brown-dark text-beige-retro px-2 py-1 animate-pulse">SYNCING...</span>}
          </div>

          <p className="text-xs text-brown-medium font-bold uppercase tracking-wide mb-6">
            Define the rules shown before every journal entry. They keep you disciplined.
          </p>

          {rulesLoaded ? (
            <div className="space-y-4">
              {tradingRules.map((rule, index) => (
                <div 
                  key={rule.id} 
                  className="border-2 border-brown-dark bg-beige-retro p-4 group transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)]"
                >
                  {/* Rule Header */}
                  <div className="flex items-start gap-3">
                    {/* Rule Number Badge */}
                    <span className="shrink-0 bg-brown-dark text-beige-retro text-[10px] font-black px-2 py-1 uppercase tracking-widest mt-1">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Rule Text Input */}
                    <textarea
                      value={rule.text}
                      onChange={(e) => updateRuleText(rule.id, e.target.value)}
                      placeholder="Write your rule here..."
                      rows={2}
                      className="flex-grow bg-transparent border-b-2 border-brown-light focus:border-brown-dark p-2 text-sm font-bold outline-none resize-none transition-colors"
                    />

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveRule(index, "up")}
                        disabled={index === 0}
                        className="text-[10px] font-black border border-brown-dark px-1.5 py-0.5 cursor-pointer hover:bg-brown-dark hover:text-beige-retro transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRule(index, "down")}
                        disabled={index === tradingRules.length - 1}
                        className="text-[10px] font-black border border-brown-dark px-1.5 py-0.5 cursor-pointer hover:bg-brown-dark hover:text-beige-retro transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="text-[10px] font-black border border-red-800 text-red-800 px-1.5 py-0.5 cursor-pointer hover:bg-red-800 hover:text-beige-retro transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Sub-Rules */}
                  {rule.subRules.length > 0 && (
                    <div className="mt-3 ml-10 space-y-2 pl-4 border-l-2 border-brown-medium">
                      {rule.subRules.map((sub, subIdx) => (
                        <div key={subIdx} className="flex items-center gap-2">
                          <span className="text-xs font-black text-brown-medium shrink-0">
                            {String.fromCharCode(65 + subIdx)}.
                          </span>
                          <input
                            type="text"
                            value={sub}
                            onChange={(e) => updateSubRuleText(rule.id, subIdx, e.target.value)}
                            className="flex-grow bg-transparent border-b border-brown-light focus:border-brown-dark p-1 text-xs font-bold outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => removeSubRule(rule.id, subIdx)}
                            className="text-[9px] font-black text-red-800 border border-red-800 px-1.5 py-0.5 cursor-pointer hover:bg-red-800 hover:text-beige-retro transition-colors shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Sub-Rule */}
                  <div className="mt-3 ml-10">
                    {editingSubRuleFor === rule.id ? (
                      <div className="flex items-center gap-2 pl-4 border-l-2 border-brown-light">
                        <span className="text-xs font-black text-brown-medium shrink-0">
                          {String.fromCharCode(65 + rule.subRules.length)}.
                        </span>
                        <input
                          type="text"
                          value={newSubRuleText}
                          onChange={(e) => setNewSubRuleText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); addSubRule(rule.id); }
                            if (e.key === "Escape") { setEditingSubRuleFor(null); setNewSubRuleText(""); }
                          }}
                          placeholder="Type sub-rule, press Enter..."
                          className="flex-grow bg-transparent border-b border-brown-light focus:border-brown-dark p-1 text-xs font-bold outline-none transition-colors"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => addSubRule(rule.id)}
                          className="text-[9px] font-black text-green-800 border border-green-800 px-1.5 py-0.5 cursor-pointer hover:bg-green-800 hover:text-beige-retro transition-colors shrink-0"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingSubRuleFor(null); setNewSubRuleText(""); }}
                          className="text-[9px] font-black text-brown-medium border border-brown-medium px-1.5 py-0.5 cursor-pointer hover:bg-brown-medium hover:text-beige-retro transition-colors shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingSubRuleFor(rule.id); setNewSubRuleText(""); }}
                        className="text-[9px] font-black uppercase text-brown-medium border border-dashed border-brown-light px-2 py-1 cursor-pointer hover:border-brown-dark hover:text-brown-dark transition-colors"
                      >
                        + Add_Sub_Rule
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Rule */}
              <button
                type="button"
                onClick={addRule}
                className="w-full border-2 border-dashed border-brown-medium p-4 text-brown-medium hover:bg-brown-dark hover:text-beige-retro transition-all uppercase font-black text-xs cursor-pointer tracking-widest duration-200 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(74,55,33,1)] active:translate-y-0 active:shadow-none"
              >
                + Initialize_New_Rule
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-brown-light p-12 text-center">
              <p className="text-brown-medium font-black uppercase tracking-widest text-xs animate-pulse">
                // LOADING_RULES...
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}