import { differenceInHours, parseISO } from 'date-fns'

export function getUrgencyClass(pickupDate) {
  const hours = differenceInHours(parseISO(pickupDate), new Date())
  if (hours < 24) return 'urgency-red'
  if (hours < 48) return 'urgency-orange'
  return 'urgency-green'
}

export function getUrgencyLabel(pickupDate) {
  const hours = differenceInHours(parseISO(pickupDate), new Date())
  if (hours < 0) return 'En retard'
  if (hours < 24) return "Aujourd'hui"
  if (hours < 48) return 'Demain'
  return `Dans ${Math.ceil(hours / 24)}j`
}
