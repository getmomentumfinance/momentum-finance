import { Check, Search, Flag, Car, Plane, BedDouble, PartyPopper, ShieldCheck, Sparkles } from 'lucide-react'
import { monthsLabel } from '../../utils/goalCalc'
import CarScene from './scenes/CarScene'
import VacationScene from './scenes/VacationScene'
import EmergencyFundScene from './scenes/EmergencyFundScene'

/**
 * Builds a 4-stage milestone list anchored to real progress fractions
 * (summary.pct), not fabricated external assumptions. `marks` are fractions
 * 0-1 of the target; a milestone is "done" once real saved/target reaches its
 * mark, "active" if it's the first not-yet-done one, otherwise "future".
 */
function buildMilestones(summary, marks, items) {
  const doneFlags = marks.map(m => summary.pct >= m * 100)
  const firstActiveIdx = doneFlags.findIndex(d => !d)
  return items.map((item, i) => {
    const status = doneFlags[i] ? 'done' : (i === firstActiveIdx ? 'active' : 'future')
    let tag
    if (status === 'done') {
      tag = 'Done'
    } else {
      const remainingAmount = Math.max(0, marks[i] * summary.target - summary.currentSaved)
      const months = summary.monthlyContribution > 0 ? Math.ceil(remainingAmount / summary.monthlyContribution) : Infinity
      tag = `In ${monthsLabel(months)}`
    }
    return { ...item, status, tag }
  })
}

export const SIMPLE_GOAL_TYPES = {
  car: {
    label: 'Buy a car',
    Scene: CarScene,
    primaryColor: '#ffbe50',
    secondaryColor: '#ff8c30',
    targetStatLabel: 'Target price',
    subtitleNoun: 'car',
    extraStatLabels: ['Insurance est.', 'Fuel est.'],
    backTitle: 'Road to your car',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.5, 0.5, 1], [
      { Icon: Check, title: 'Started car fund', desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : `${fmt(summary.currentSaved)} saved so far` },
      { Icon: Search, title: 'Research & test drives', desc: 'Shortlist models · check insurance quotes' },
      { Icon: Flag, title: 'Halfway there', desc: `${fmt(summary.target / 2)} milestone` },
      { Icon: Car, title: 'Buy the car', desc: `${fmt(summary.target)} target · full cash purchase` },
    ]),
  },
  vacation: {
    label: 'Save for a trip',
    Scene: VacationScene,
    primaryColor: '#64b4ff',
    secondaryColor: '#4a80ff',
    targetStatLabel: 'Trip budget',
    subtitleNoun: 'trip',
    extraStatLabels: ['Flights est.', 'Hotel est.'],
    backTitle: 'Road to your trip',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.6, 0.8, 1], [
      { Icon: Check, title: 'Trip decided', desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : 'Destination set · dates in mind' },
      { Icon: Plane, title: 'Book flights', desc: 'Best prices booked early' },
      { Icon: BedDouble, title: 'Book accommodation', desc: 'Budget set aside for the stay' },
      { Icon: PartyPopper, title: 'Take off!', desc: 'Fully funded · spending money ready' },
    ]),
  },
  fund: {
    label: 'Build emergency fund',
    Scene: EmergencyFundScene,
    primaryColor: '#64e8c8',
    secondaryColor: '#40b8a0',
    targetStatLabel: 'Target',
    subtitleNoun: 'safety net',
    extraStatLabels: [],
    backTitle: 'Building your safety net',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.5, 1, 1], [
      { Icon: Check, title: 'Fund started', desc: savingsCardName ? `${savingsCardName} linked · ${fmt(summary.currentSaved)} saved so far` : `${fmt(summary.currentSaved)} saved so far` },
      { Icon: Flag, title: 'Halfway there', desc: `${fmt(summary.target / 2)} saved · breathing room starts here` },
      { Icon: ShieldCheck, title: 'Fully covered', desc: `${fmt(summary.target)} reached · fund complete` },
      { Icon: Sparkles, title: 'Funds available for your next goal', desc: 'Redirect savings once this is funded' },
    ]),
  },
}
