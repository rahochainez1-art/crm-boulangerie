export const getPrenom       = () => localStorage.getItem('agj_profil_name') ?? ''
export const savePrenom      = (v) => {
  v?.trim()
    ? localStorage.setItem('agj_profil_name', v.trim())
    : localStorage.removeItem('agj_profil_name')
  window.dispatchEvent(new Event('agj_settings_updated'))
}
export const getUrgencyHours = () => parseInt(localStorage.getItem('agj_urgency_hours') ?? '24', 10)
export const saveUrgencyHours = (h) => localStorage.setItem('agj_urgency_hours', String(h))
export const getSoundEnabled  = () => localStorage.getItem('agj_sound_enabled') !== 'false'
export const saveSoundEnabled = (v) => localStorage.setItem('agj_sound_enabled', v ? 'true' : 'false')
