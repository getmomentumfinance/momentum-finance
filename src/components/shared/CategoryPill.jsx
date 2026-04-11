import {
  // Food & Drink
  UtensilsCrossed, Utensils, Coffee, Pizza, Apple, Wine, Beer, Sandwich, ChefHat, Cake, Candy, Milk, IceCream2,
  // Shopping & Retail
  ShoppingCart, ShoppingBag, ShoppingBasket, Store, Tag, Tags, Barcode, QrCode, Package, Package2, Box, Boxes, Gem, Crown, Sparkles, Shirt, Glasses, Watch,
  // Finance & Money
  Banknote, CreditCard, Wallet, PiggyBank, TrendingUp, TrendingDown, ArrowUpDown, Receipt, ReceiptText, Percent, Calculator, Landmark, Scale, Euro, BarChart2, BarChart3, PieChart, LineChart, CircleDollarSign, BadgeDollarSign, HandCoins, Vault, ChartNoAxesCombined,
  // Business & Work
  Briefcase, Laptop, Building2, Building, Factory, Truck, Handshake, FileText, FileSpreadsheet, ClipboardList, FolderOpen, Award, Trophy, Target, Megaphone, Mail, Phone, Printer, PenLine, Warehouse, ShieldCheck, BookCheck, CalendarSync, GraduationCap, Pencil, PencilLine, Send,
  // Transport
  Car, Bus, Plane, Train, Bike, Fuel, Ship, Rocket, CarFront, Forklift, EvCharger, Signpost, TrafficCone,
  // Health & Wellness
  Heart, Activity, Dumbbell, Pill, Stethoscope, Syringe, Bandage, Thermometer, FlaskConical, Microscope, Ambulance, Dna, HeartHandshake, Hospital, Tablets,
  // Home & Living
  Home, Zap, Wifi, Wrench, Tv, Sofa, Bath, BedDouble, Lamp, Hammer, PaintBucket, Palette, Plug, Fan, Microwave, House, PaintRoller, ShowerHead, Unplug,
  // Entertainment & Leisure
  Music, Film, BookOpen, Gamepad2, Camera, Ticket, Headphones, Mic, Radio, Medal, Guitar, Dice5, Ghost, Music2, Music4, PartyPopper, Volume2,
  // Travel & Outdoors
  Backpack, Luggage, Compass, Tent, Mountain, Map, Globe, TreePine,
  // Tech
  Smartphone, Monitor, Cloud, Lock, Key, Shield, Cpu, HardDrive, Binary, IterationCcw, KeyRound, Loader, Network, Server, Shell, ToggleRight,
  // Personal
  User, Scissors, Baby, PawPrint, Cat, EyeClosed, MessageSquareHeart,
  // Fashion & Beauty
  Footprints, Feather, Wand2, Flower2, Droplets, Droplet, Moon, Snowflake, Paintbrush, BadgePercent,
  // Misc
  Gift, Leaf, Sun, Star, Recycle, Flame, AlarmClock, ChevronRight, Pickaxe, Repeat, RotateCw, Slash, Sprout, ThumbsDown, ThumbsUp, Trash2,
} from 'lucide-react'

export const CATEGORY_ICONS = [
  // ── Finance & Money ─────────────────────────────────────────
  { id: 'arrow-updown',              Icon: ArrowUpDown,          group: 'Finance' },
  { id: 'badge-dollar',              Icon: BadgeDollarSign,      group: 'Finance' },
  { id: 'banknote',                  Icon: Banknote,             group: 'Finance' },
  { id: 'bar-chart',                 Icon: BarChart2,            group: 'Finance' },
  { id: 'bar-chart-3',               Icon: BarChart3,            group: 'Finance' },
  { id: 'calculator',                Icon: Calculator,           group: 'Finance' },
  { id: 'chart-no-axes-combined',    Icon: ChartNoAxesCombined,  group: 'Finance' },
  { id: 'circle-dollar',             Icon: CircleDollarSign,     group: 'Finance' },
  { id: 'credit-card',               Icon: CreditCard,           group: 'Finance' },
  { id: 'euro',                      Icon: Euro,                 group: 'Finance' },
  { id: 'hand-coins',                Icon: HandCoins,            group: 'Finance' },
  { id: 'landmark',                  Icon: Landmark,             group: 'Finance' },
  { id: 'line-chart',                Icon: LineChart,            group: 'Finance' },
  { id: 'percent',                   Icon: Percent,              group: 'Finance' },
  { id: 'pie-chart',                 Icon: PieChart,             group: 'Finance' },
  { id: 'piggybank',                 Icon: PiggyBank,            group: 'Finance' },
  { id: 'receipt',                   Icon: Receipt,              group: 'Finance' },
  { id: 'receipt-text',              Icon: ReceiptText,          group: 'Finance' },
  { id: 'scale',                     Icon: Scale,                group: 'Finance' },
  { id: 'trending-down',             Icon: TrendingDown,         group: 'Finance' },
  { id: 'trending-up',               Icon: TrendingUp,           group: 'Finance' },
  { id: 'vault',                     Icon: Vault,                group: 'Finance' },
  { id: 'wallet',                    Icon: Wallet,               group: 'Finance' },

  // ── Business & Work ─────────────────────────────────────────
  { id: 'award',                     Icon: Award,                group: 'Business' },
  { id: 'book-check',                Icon: BookCheck,            group: 'Business' },
  { id: 'briefcase',                 Icon: Briefcase,            group: 'Business' },
  { id: 'building',                  Icon: Building2,            group: 'Business' },
  { id: 'building2',                 Icon: Building,             group: 'Business' },
  { id: 'calendar-sync',             Icon: CalendarSync,         group: 'Business' },
  { id: 'clipboard',                 Icon: ClipboardList,        group: 'Business' },
  { id: 'factory',                   Icon: Factory,              group: 'Business' },
  { id: 'file-sheet',                Icon: FileSpreadsheet,      group: 'Business' },
  { id: 'file-text',                 Icon: FileText,             group: 'Business' },
  { id: 'folder',                    Icon: FolderOpen,           group: 'Business' },
  { id: 'forklift',                  Icon: Forklift,             group: 'Business' },
  { id: 'graduation-cap',            Icon: GraduationCap,        group: 'Business' },
  { id: 'handshake',                 Icon: Handshake,            group: 'Business' },
  { id: 'laptop',                    Icon: Laptop,               group: 'Business' },
  { id: 'mail',                      Icon: Mail,                 group: 'Business' },
  { id: 'megaphone',                 Icon: Megaphone,            group: 'Business' },
  { id: 'pen',                       Icon: PenLine,              group: 'Business' },
  { id: 'pencil',                    Icon: Pencil,               group: 'Business' },
  { id: 'pencil-line',               Icon: PencilLine,           group: 'Business' },
  { id: 'phone',                     Icon: Phone,                group: 'Business' },
  { id: 'printer',                   Icon: Printer,              group: 'Business' },
  { id: 'send',                      Icon: Send,                 group: 'Business' },
  { id: 'shield-check',              Icon: ShieldCheck,          group: 'Business' },
  { id: 'target',                    Icon: Target,               group: 'Business' },
  { id: 'trophy',                    Icon: Trophy,               group: 'Business' },
  { id: 'truck',                     Icon: Truck,                group: 'Business' },
  { id: 'warehouse',                 Icon: Warehouse,            group: 'Business' },

  // ── Shopping & Retail ───────────────────────────────────────
  { id: 'bag',                       Icon: ShoppingBag,          group: 'Shopping' },
  { id: 'barcode',                   Icon: Barcode,              group: 'Shopping' },
  { id: 'basket',                    Icon: ShoppingBasket,       group: 'Shopping' },
  { id: 'box',                       Icon: Box,                  group: 'Shopping' },
  { id: 'boxes',                     Icon: Boxes,                group: 'Shopping' },
  { id: 'cart',                      Icon: ShoppingCart,         group: 'Shopping' },
  { id: 'crown',                     Icon: Crown,                group: 'Shopping' },
  { id: 'gem',                       Icon: Gem,                  group: 'Shopping' },
  { id: 'glasses',                   Icon: Glasses,              group: 'Shopping' },
  { id: 'package',                   Icon: Package,              group: 'Shopping' },
  { id: 'package2',                  Icon: Package2,             group: 'Shopping' },
  { id: 'qr-code',                   Icon: QrCode,               group: 'Shopping' },
  { id: 'shirt',                     Icon: Shirt,                group: 'Shopping' },
  { id: 'sparkles',                  Icon: Sparkles,             group: 'Shopping' },
  { id: 'store',                     Icon: Store,                group: 'Shopping' },
  { id: 'tag',                       Icon: Tag,                  group: 'Shopping' },
  { id: 'tags',                      Icon: Tags,                 group: 'Shopping' },
  { id: 'watch',                     Icon: Watch,                group: 'Shopping' },

  // ── Food & Drink ────────────────────────────────────────────
  { id: 'apple',                     Icon: Apple,                group: 'Food' },
  { id: 'beer',                      Icon: Beer,                 group: 'Food' },
  { id: 'cake',                      Icon: Cake,                 group: 'Food' },
  { id: 'candy',                     Icon: Candy,                group: 'Food' },
  { id: 'chef-hat',                  Icon: ChefHat,              group: 'Food' },
  { id: 'coffee',                    Icon: Coffee,               group: 'Food' },
  { id: 'ice-cream',                 Icon: IceCream2,            group: 'Food' },
  { id: 'milk',                      Icon: Milk,                 group: 'Food' },
  { id: 'pizza',                     Icon: Pizza,                group: 'Food' },
  { id: 'sandwich',                  Icon: Sandwich,             group: 'Food' },
  { id: 'utensils',                  Icon: UtensilsCrossed,      group: 'Food' },
  { id: 'utensils-2',                Icon: Utensils,             group: 'Food' },
  { id: 'wine',                      Icon: Wine,                 group: 'Food' },

  // ── Transport ───────────────────────────────────────────────
  { id: 'bike',                      Icon: Bike,                 group: 'Transport' },
  { id: 'bus',                       Icon: Bus,                  group: 'Transport' },
  { id: 'car',                       Icon: Car,                  group: 'Transport' },
  { id: 'car-front',                 Icon: CarFront,             group: 'Transport' },
  { id: 'ev-charger',                Icon: EvCharger,            group: 'Transport' },
  { id: 'fuel',                      Icon: Fuel,                 group: 'Transport' },
  { id: 'plane',                     Icon: Plane,                group: 'Transport' },
  { id: 'rocket',                    Icon: Rocket,               group: 'Transport' },
  { id: 'ship',                      Icon: Ship,                 group: 'Transport' },
  { id: 'signpost',                  Icon: Signpost,             group: 'Transport' },
  { id: 'traffic-cone',              Icon: TrafficCone,          group: 'Transport' },
  { id: 'train',                     Icon: Train,                group: 'Transport' },

  // ── Health & Wellness ───────────────────────────────────────
  { id: 'activity',                  Icon: Activity,             group: 'Health' },
  { id: 'ambulance',                 Icon: Ambulance,            group: 'Health' },
  { id: 'bandage',                   Icon: Bandage,              group: 'Health' },
  { id: 'dna',                       Icon: Dna,                  group: 'Health' },
  { id: 'dumbbell',                  Icon: Dumbbell,             group: 'Health' },
  { id: 'flask',                     Icon: FlaskConical,         group: 'Health' },
  { id: 'heart',                     Icon: Heart,                group: 'Health' },
  { id: 'heart-handshake',           Icon: HeartHandshake,       group: 'Health' },
  { id: 'hospital',                  Icon: Hospital,             group: 'Health' },
  { id: 'microscope',                Icon: Microscope,           group: 'Health' },
  { id: 'pill',                      Icon: Pill,                 group: 'Health' },
  { id: 'stethoscope',               Icon: Stethoscope,          group: 'Health' },
  { id: 'syringe',                   Icon: Syringe,              group: 'Health' },
  { id: 'tablets',                   Icon: Tablets,              group: 'Health' },
  { id: 'thermometer',               Icon: Thermometer,          group: 'Health' },

  // ── Home & Living ───────────────────────────────────────────
  { id: 'bath',                      Icon: Bath,                 group: 'Home' },
  { id: 'bed',                       Icon: BedDouble,            group: 'Home' },
  { id: 'fan',                       Icon: Fan,                  group: 'Home' },
  { id: 'hammer',                    Icon: Hammer,               group: 'Home' },
  { id: 'home',                      Icon: Home,                 group: 'Home' },
  { id: 'house',                     Icon: House,                group: 'Home' },
  { id: 'lamp',                      Icon: Lamp,                 group: 'Home' },
  { id: 'microwave',                 Icon: Microwave,            group: 'Home' },
  { id: 'paint-bucket',              Icon: PaintBucket,          group: 'Home' },
  { id: 'paint-roller',              Icon: PaintRoller,          group: 'Home' },
  { id: 'palette',                   Icon: Palette,              group: 'Home' },
  { id: 'plug',                      Icon: Plug,                 group: 'Home' },
  { id: 'shower-head',               Icon: ShowerHead,           group: 'Home' },
  { id: 'sofa',                      Icon: Sofa,                 group: 'Home' },
  { id: 'tv',                        Icon: Tv,                   group: 'Home' },
  { id: 'unplug',                    Icon: Unplug,               group: 'Home' },
  { id: 'wifi',                      Icon: Wifi,                 group: 'Home' },
  { id: 'wrench',                    Icon: Wrench,               group: 'Home' },
  { id: 'zap',                       Icon: Zap,                  group: 'Home' },

  // ── Entertainment ───────────────────────────────────────────
  { id: 'book',                      Icon: BookOpen,             group: 'Entertainment' },
  { id: 'camera',                    Icon: Camera,               group: 'Entertainment' },
  { id: 'dice',                      Icon: Dice5,                group: 'Entertainment' },
  { id: 'film',                      Icon: Film,                 group: 'Entertainment' },
  { id: 'gamepad',                   Icon: Gamepad2,             group: 'Entertainment' },
  { id: 'ghost',                     Icon: Ghost,                group: 'Entertainment' },
  { id: 'guitar',                    Icon: Guitar,               group: 'Entertainment' },
  { id: 'headphones',                Icon: Headphones,           group: 'Entertainment' },
  { id: 'medal',                     Icon: Medal,                group: 'Entertainment' },
  { id: 'mic',                       Icon: Mic,                  group: 'Entertainment' },
  { id: 'music',                     Icon: Music,                group: 'Entertainment' },
  { id: 'music-2',                   Icon: Music2,               group: 'Entertainment' },
  { id: 'music-4',                   Icon: Music4,               group: 'Entertainment' },
  { id: 'party-popper',              Icon: PartyPopper,          group: 'Entertainment' },
  { id: 'radio',                     Icon: Radio,                group: 'Entertainment' },
  { id: 'ticket',                    Icon: Ticket,               group: 'Entertainment' },
  { id: 'volume-2',                  Icon: Volume2,              group: 'Entertainment' },

  // ── Travel & Outdoors ───────────────────────────────────────
  { id: 'backpack',                  Icon: Backpack,             group: 'Travel' },
  { id: 'compass',                   Icon: Compass,              group: 'Travel' },
  { id: 'globe',                     Icon: Globe,                group: 'Travel' },
  { id: 'luggage',                   Icon: Luggage,              group: 'Travel' },
  { id: 'map',                       Icon: Map,                  group: 'Travel' },
  { id: 'mountain',                  Icon: Mountain,             group: 'Travel' },
  { id: 'tent',                      Icon: Tent,                 group: 'Travel' },
  { id: 'tree-pine',                 Icon: TreePine,             group: 'Travel' },

  // ── Tech ────────────────────────────────────────────────────
  { id: 'binary',                    Icon: Binary,               group: 'Tech' },
  { id: 'cloud',                     Icon: Cloud,                group: 'Tech' },
  { id: 'cpu',                       Icon: Cpu,                  group: 'Tech' },
  { id: 'hard-drive',                Icon: HardDrive,            group: 'Tech' },
  { id: 'iteration-ccw',             Icon: IterationCcw,         group: 'Tech' },
  { id: 'key',                       Icon: Key,                  group: 'Tech' },
  { id: 'key-round',                 Icon: KeyRound,             group: 'Tech' },
  { id: 'loader',                    Icon: Loader,               group: 'Tech' },
  { id: 'lock',                      Icon: Lock,                 group: 'Tech' },
  { id: 'monitor',                   Icon: Monitor,              group: 'Tech' },
  { id: 'network',                   Icon: Network,              group: 'Tech' },
  { id: 'server',                    Icon: Server,               group: 'Tech' },
  { id: 'shell',                     Icon: Shell,                group: 'Tech' },
  { id: 'shield',                    Icon: Shield,               group: 'Tech' },
  { id: 'smartphone',                Icon: Smartphone,           group: 'Tech' },
  { id: 'toggle-right',              Icon: ToggleRight,          group: 'Tech' },

  // ── Personal ────────────────────────────────────────────────
  { id: 'baby',                      Icon: Baby,                 group: 'Personal' },
  { id: 'cat',                       Icon: Cat,                  group: 'Personal' },
  { id: 'eye-closed',                Icon: EyeClosed,            group: 'Personal' },
  { id: 'message-square-heart',      Icon: MessageSquareHeart,   group: 'Personal' },
  { id: 'paw',                       Icon: PawPrint,             group: 'Personal' },
  { id: 'scissors',                  Icon: Scissors,             group: 'Personal' },
  { id: 'user',                      Icon: User,                 group: 'Personal' },

  // ── Fashion & Beauty ────────────────────────────────────────
  { id: 'badge-percent',             Icon: BadgePercent,         group: 'Fashion' },
  { id: 'droplet',                   Icon: Droplet,              group: 'Fashion' },
  { id: 'droplets',                  Icon: Droplets,             group: 'Fashion' },
  { id: 'feather',                   Icon: Feather,              group: 'Fashion' },
  { id: 'flower',                    Icon: Flower2,              group: 'Fashion' },
  { id: 'footprints',                Icon: Footprints,           group: 'Fashion' },
  { id: 'moon',                      Icon: Moon,                 group: 'Fashion' },
  { id: 'paintbrush',                Icon: Paintbrush,           group: 'Fashion' },
  { id: 'snowflake',                 Icon: Snowflake,            group: 'Fashion' },
  { id: 'wand',                      Icon: Wand2,                group: 'Fashion' },

  // ── Misc ────────────────────────────────────────────────────
  { id: 'alarm-clock',               Icon: AlarmClock,           group: 'Misc' },
  { id: 'chevron-right',             Icon: ChevronRight,         group: 'Misc' },
  { id: 'flame',                     Icon: Flame,                group: 'Misc' },
  { id: 'gift',                      Icon: Gift,                 group: 'Misc' },
  { id: 'leaf',                      Icon: Leaf,                 group: 'Misc' },
  { id: 'pickaxe',                   Icon: Pickaxe,              group: 'Misc' },
  { id: 'recycle',                   Icon: Recycle,              group: 'Misc' },
  { id: 'repeat',                    Icon: Repeat,               group: 'Misc' },
  { id: 'rotate-cw',                 Icon: RotateCw,             group: 'Misc' },
  { id: 'slash',                     Icon: Slash,                group: 'Misc' },
  { id: 'sprout',                    Icon: Sprout,               group: 'Misc' },
  { id: 'star',                      Icon: Star,                 group: 'Misc' },
  { id: 'sun',                       Icon: Sun,                  group: 'Misc' },
  { id: 'thumbs-down',               Icon: ThumbsDown,           group: 'Misc' },
  { id: 'thumbs-up',                 Icon: ThumbsUp,             group: 'Misc' },
  { id: 'trash-2',                   Icon: Trash2,               group: 'Misc' },
]

export const ICONS_MAP = Object.fromEntries(CATEGORY_ICONS.map(({ id, Icon }) => [id, Icon]))

// Unique groups in order
export const ICON_GROUPS = [...new Set(CATEGORY_ICONS.map(i => i.group))]

export function CategoryPill({ name, color, icon }) {
  const IconComp = icon ? ICONS_MAP[icon] : null
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white min-w-0"
      style={{ background: color ?? 'rgba(255,255,255,0.15)' }}>
      {IconComp && <IconComp size={11} className="shrink-0 text-white" />}
      {!IconComp && color && <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/60" />}
      {name && <span className="truncate">{name}</span>}
    </span>
  )
}
