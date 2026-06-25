import {
  Check, Search, Flag, Car, Plane, BedDouble, PartyPopper, ShieldCheck, Sparkles,
  Heart, CalendarCheck, Flower2, Baby, Bed, HeartPulse, Sofa, Home,
  Briefcase, FileText, Laptop, Rocket, Gift, Cake, TreePine, RotateCcw,
  Palette, Paintbrush,
} from 'lucide-react'
import { monthsLabel } from '../../utils/goalCalc'
import CarScene from './scenes/CarScene'
import VacationScene from './scenes/VacationScene'
import EmergencyFundScene from './scenes/EmergencyFundScene'
import WeddingScene from './scenes/WeddingScene'
import BabyScene from './scenes/BabyScene'
import FurnitureScene from './scenes/FurnitureScene'
import BusinessScene from './scenes/BusinessScene'
import GiftScene from './scenes/GiftScene'
import ArtScene from './scenes/ArtScene'

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
  wedding: {
    label: 'Plan a wedding',
    Scene: WeddingScene,
    primaryColor: '#ffa0b4',
    secondaryColor: '#ff6090',
    targetStatLabel: 'Total budget',
    subtitleNoun: 'big day',
    extraStatLabels: ['Venue deposit', 'Rings budget'],
    backTitle: 'Road to your big day',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.25, 0.7, 1], [
      { Icon: Check, title: 'Saving started', desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : `${fmt(summary.currentSaved)} set aside · goal created` },
      { Icon: CalendarCheck, title: 'Book the venue', desc: 'Deposit due ~12 months in advance' },
      { Icon: Flower2, title: 'Book catering & flowers', desc: 'Locked in closer to the date' },
      { Icon: Heart, title: 'The big day', desc: 'Fully funded · nothing to worry about' },
    ]),
  },
  baby: {
    label: 'Save for a baby',
    Scene: BabyScene,
    primaryColor: '#c8b4ff',
    secondaryColor: '#a080e0',
    targetStatLabel: 'Total fund',
    subtitleNoun: 'little one',
    subtitle: (fmt, contribution) => `putting aside ${fmt(contribution)}/mo for your little one`,
    extraStatLabels: ['Gear & nursery', 'Leave buffer'],
    backTitle: 'Road to parenthood',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.6, 0.85, 1], [
      { Icon: Check, title: 'Started baby fund', desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : `${fmt(summary.currentSaved)} saved · long-term planning` },
      { Icon: Bed, title: 'Set up nursery', desc: 'Crib, furniture, gear' },
      { Icon: HeartPulse, title: 'Medical & birth costs', desc: 'Often covered, but buffer ready' },
      { Icon: Baby, title: 'Fully funded & ready', desc: 'Parental leave buffer · childcare deposit' },
    ]),
  },
  furniture: {
    label: 'Furnish your home',
    Scene: FurnitureScene,
    primaryColor: '#ffb464',
    secondaryColor: '#e07840',
    targetStatLabel: 'Total budget',
    subtitleNoun: 'home',
    subtitle: (fmt, contribution) => `putting aside ${fmt(contribution)}/mo to make it feel like home`,
    extraStatLabels: ['Living room', 'Bedroom'],
    backTitle: 'Making it feel like home',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.4, 0.75, 1], [
      { Icon: Check, title: 'Fund started', desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : `${fmt(summary.currentSaved)} saved so far` },
      { Icon: Sofa, title: 'Buy sofa & living room', desc: 'Priority room first' },
      { Icon: Bed, title: 'Bedroom & dining', desc: 'Bed frame, table, chairs' },
      { Icon: Home, title: 'Fully furnished', desc: 'Art, plants, finishing touches' },
    ]),
  },
  business: {
    label: 'Start a business',
    Scene: BusinessScene,
    primaryColor: '#50dc8c',
    secondaryColor: '#30a060',
    targetStatLabel: 'Runway fund',
    subtitleNoun: 'business',
    extraStatLabels: ['12 mo runway', 'Setup costs'],
    backTitle: 'Road to your business',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.25, 0.7, 1], [
      { Icon: Check, title: 'Runway fund started', desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : `${fmt(summary.currentSaved)} saved · idea validated` },
      { Icon: FileText, title: 'Register the business', desc: 'Official registration · paperwork sorted' },
      { Icon: Laptop, title: 'First clients & setup', desc: 'Tools, legal, accountant' },
      { Icon: Rocket, title: 'Go full-time', desc: '12 months runway · quit the day job' },
    ]),
  },
  art: {
    label: 'Fund a creative project',
    Scene: ArtScene,
    primaryColor: '#a08cff',
    secondaryColor: '#7060d0',
    targetStatLabel: 'Total budget',
    subtitleNoun: 'creative work',
    subtitle: (fmt, contribution) => `putting aside ${fmt(contribution)}/mo for your creative work`,
    extraStatLabels: ['Equipment', 'Supplies'],
    backTitle: 'Road to your creative project',
    milestones: (summary, fmt, savingsCardName) => buildMilestones(summary, [0, 0.35, 0.7, 1], [
      { Icon: Check, title: 'Project defined', desc: savingsCardName ? `Savings card linked · ${savingsCardName}` : `${fmt(summary.currentSaved)} saved · wishlist ready` },
      { Icon: Palette, title: 'Buy core supplies', desc: 'Paints, brushes, canvas' },
      { Icon: Laptop, title: 'Buy equipment', desc: 'Drawing tablet, camera, or gear' },
      { Icon: Paintbrush, title: 'Start creating', desc: 'Fully equipped · no excuses left' },
    ]),
  },
  gift: {
    label: 'Build a gift fund',
    Scene: GiftScene,
    primaryColor: '#ffd250',
    secondaryColor: '#e09820',
    targetStatLabel: 'Annual budget',
    subtitleNoun: 'gift fund',
    subtitle: (fmt, contribution) => `putting aside ${fmt(contribution)}/mo · never stress about gifts again`,
    sliderLabel: 'Adjust monthly top-up',
    recurring: true,
    extraStatLabels: ['Christmas', 'Birthdays', 'Other occasions'],
    backTitle: 'Your gift calendar',
    milestones: (summary, fmt, savingsCardName) => [
      { Icon: Check, status: 'done', title: 'Fund active', desc: savingsCardName ? `Auto top-up running · ${savingsCardName} linked` : `Auto top-up running · ${fmt(summary.currentSaved)} in pot`, tag: 'Done' },
      { Icon: Cake, status: 'active', title: 'Birthday season', desc: 'Family & friends, throughout the year', tag: 'Ongoing' },
      { Icon: TreePine, status: 'future', title: 'Sinterklaas & Christmas', desc: 'December budget locked · no last-minute panic', tag: 'Dec' },
      { Icon: RotateCcw, status: 'future', title: 'Resets January 1st', desc: 'Rolls over · starts filling again', tag: 'Yearly' },
    ],
  },
}
