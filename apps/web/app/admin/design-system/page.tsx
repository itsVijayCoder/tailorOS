import type { Metadata } from "next";
import Link from "next/link";
import {
   ArrowUpRight,
   BadgeCheck,
   CheckCircle2,
   ChevronDown,
   ClipboardCheck,
   Command,
   CreditCard,
   Layers3,
   MessageCircle,
   MousePointer2,
   Palette,
   Search,
   ShieldCheck,
   Sparkles,
   TimerReset,
   Type,
   Workflow,
} from "lucide-react";

import {
   CustomerProfileChip,
   MeasurementField,
   OrderStatusTimeline,
   ReceiptPreview,
   WhatsAppDeliveryBadge,
} from "@/components/tailoros";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import {
   DropdownMenu,
   DropdownMenuItem,
   DropdownMenuPopup,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
   title: "Phase 02 Design System",
   description:
      "TailorOS Phase 02 design-system, UI foundation, micro-interaction, status, accessibility, and edge-case reference.",
};

const navItems = [
   { href: "#overview", label: "Overview" },
   { href: "#tokens", label: "Tokens" },
   { href: "#typography", label: "Typography" },
   { href: "#primitives", label: "Primitives" },
   { href: "#business-ui", label: "Business UI" },
   { href: "#motion", label: "Motion" },
   { href: "#state", label: "State" },
   { href: "#edge-cases", label: "Edge cases" },
   { href: "#completion", label: "Completion" },
];

const docInsights = [
   {
      icon: Search,
      title: "Search-first operating model",
      body: "The TailorOS PRD makes global search the first workflow, with exact phone, customer, order, receipt, and status matches before staff choose a module.",
   },
   {
      icon: ShieldCheck,
      title: "Mobile is not identity",
      body: "Shared family mobile numbers must reveal individual profiles before measurements or orders appear, preventing wrong-person garment history.",
   },
   {
      icon: MessageCircle,
      title: "WhatsApp stays separate",
      body: "The connector PRD keeps provider credentials, templates, policy, delivery status, and inbound routing outside TailorOS product UI.",
   },
   {
      icon: Workflow,
      title: "Cloudflare tenant isolation",
      body: "The stack guide favors a control plane, per-tenant D1 data, queue-backed provisioning, and event-driven projections over a single shared backend.",
   },
];

const tokenGroups = [
   {
      title: "Surface",
      tokens: [
         { className: "bg-page", name: "page", value: "bg-page" },
         { className: "bg-surface", name: "surface", value: "bg-surface" },
         {
            className: "bg-surface-strong",
            name: "surface-strong",
            value: "bg-surface-strong",
         },
         {
            className: "bg-signal-faded",
            name: "signal-faded",
            value: "bg-signal-faded",
         },
      ],
   },
   {
      title: "Brand",
      tokens: [
         { className: "bg-accent", name: "accent", value: "bg-accent" },
         {
            className: "bg-accent-darker",
            name: "accent-darker",
            value: "bg-accent-darker",
         },
         { className: "bg-signal", name: "signal", value: "bg-signal" },
         {
            className: "bg-brand-copper",
            name: "brand-copper",
            value: "bg-brand-copper",
         },
      ],
   },
   {
      title: "State",
      tokens: [
         {
            className: "bg-state-success",
            name: "success",
            value: "bg-state-success",
         },
         {
            className: "bg-state-warning",
            name: "warning",
            value: "bg-state-warning",
         },
         {
            className: "bg-state-danger",
            name: "danger",
            value: "bg-state-danger",
         },
         { className: "bg-wa-read", name: "wa-read", value: "bg-wa-read" },
      ],
   },
];

const componentRules = [
   "Primitives do not import TailorOS business DTOs.",
   "Business components accept typed props but never fetch data directly.",
   "Feature hooks own mutations, optimistic updates, and invalidation.",
   "Every interactive control exposes disabled, loading, focus, and keyboard states.",
];

const motionRules = [
   { label: "Button tap", value: "90-120ms scale feedback" },
   { label: "Search debounce", value: "120-180ms before query" },
   { label: "Dialog/drawer", value: "180-240ms opacity/transform" },
   { label: "Route content", value: "180-260ms shell stays stable" },
];

const edgeCases = [
   "Same mobile number can map to many family members.",
   "Duplicate customer creation needs visible match warnings.",
   "Measurement changes create versions and never rewrite old order snapshots.",
   "Partial delivery tracks item state separately from order state.",
   "Payment corrections require adjustment rows and audit reason.",
   "WhatsApp opt-out blocks non-required messages before send.",
];

const timelineSteps = [
   {
      actor: "Nisha",
      label: "Booked",
      status: "booked" as const,
      timestamp: "10:12 AM",
   },
   {
      actor: "Master Arun",
      label: "Cutting",
      status: "in-progress" as const,
      timestamp: "12:40 PM",
   },
   {
      actor: "Counter",
      current: true,
      label: "Trial required",
      status: "delayed" as const,
      timestamp: "Tomorrow",
   },
];

export default function DesignSystemPage() {
   return (
      <main className='min-h-screen bg-page text-ink-body'>
         <header className='sticky top-0 z-40 border-b border-hairline bg-page/88 backdrop-blur-xl'>
            <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
               <a className='group flex items-center gap-3' href='#overview'>
                  <span className='grid size-10 place-items-center rounded-full border border-hairline bg-accent text-sm font-bold text-accent-foreground shadow-token transition duration-200 ease-premium group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none'>
                     TX
                  </span>
                  <span className='leading-tight'>
                     <strong className='block font-display text-xl font-medium leading-none text-ink-display'>
                        TailorOS
                     </strong>
                     <span className='block text-xs font-semibold uppercase tracking-wide text-ink-muted'>
                        Phase 02 system
                     </span>
                  </span>
               </a>
               <nav className='hidden items-center gap-1 rounded-full border border-hairline bg-surface p-1 shadow-sm lg:flex'>
                  {navItems.slice(0, 6).map((item) => (
                     <a
                        className='rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted transition duration-200 ease-premium hover:bg-accent-faded hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
                        href={item.href}
                        key={item.href}
                     >
                        {item.label}
                     </a>
                  ))}
               </nav>
               <div className='flex items-center gap-2'>
                  <ThemeToggle />
                  <Link
                     className='hidden min-h-10 items-center justify-center rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm font-semibold text-ink-display shadow-sm transition duration-200 ease-premium hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:inline-flex'
                     href='/'
                  >
                     Home
                  </Link>
               </div>
            </div>
         </header>

         <section
            className='border-b border-hairline bg-page px-4 py-10 sm:px-6 lg:px-8 lg:py-14'
            id='overview'
         >
            <div className='mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end'>
               <div className='max-w-4xl' data-reveal>
                  <Badge variant='signal'>
                     <BadgeCheck aria-hidden className='size-3.5' />
                     Phase 02 implementation reference
                  </Badge>
                  <h1 className='mt-5 text-balance font-display text-5xl font-semibold leading-[0.95] text-ink-display sm:text-6xl lg:text-7xl'>
                     Premium UI foundation for a fast tailor-shop operating
                     desk.
                  </h1>
                  <p className='mt-5 max-w-3xl text-base leading-7 text-ink-body sm:text-lg'>
                     This route documents the live TailorOS token contract,
                     owned primitives, business UI examples, motion timing,
                     state rules, and edge cases derived from the product PRDs
                     and Cloudflare stack guide.
                  </p>
                  <div className='mt-6 flex flex-wrap gap-3'>
                     <Button>
                        <Search aria-hidden className='size-4' />
                        Search-first UI
                     </Button>
                     <Button variant='secondary'>
                        <Palette aria-hidden className='size-4' />
                        Light-golden tokens
                     </Button>
                     <Button variant='signal'>
                        <TimerReset aria-hidden className='size-4' />
                        Reduced-motion safe
                     </Button>
                  </div>
               </div>
               <div
                  className='rounded-xl border border-hairline bg-surface-strong p-5 shadow-lift'
                  data-reveal
               >
                  <div className='flex items-start justify-between gap-4'>
                     <div>
                        <p className='text-xs font-semibold uppercase tracking-wide text-ink-muted'>
                           Operating pulse
                        </p>
                        <h2 className='mt-2 font-display text-3xl font-medium leading-none text-ink-display'>
                           Counter-safe by design
                        </h2>
                     </div>
                     <Command aria-hidden className='size-5 text-accent' />
                  </div>
                  <div className='mt-5 grid gap-3'>
                     {[
                        ["Tap feedback", "<100ms"],
                        ["Search debounce", "120-180ms"],
                        ["Route motion", "180-260ms"],
                        ["Layout jank", "0"],
                     ].map(([label, value]) => (
                        <div
                           className='flex items-center justify-between rounded-lg border border-hairline bg-surface px-3 py-2'
                           key={label}
                        >
                           <span className='text-sm text-ink-muted'>
                              {label}
                           </span>
                           <strong className='font-ui text-sm text-ink-display'>
                              {value}
                           </strong>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </section>

         <div className='mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8'>
            <aside className='hidden lg:block'>
               <nav
                  className='sticky top-24 grid gap-1'
                  aria-label='Design system sections'
               >
                  {navItems.map((item) => (
                     <a
                        className='rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition duration-200 ease-premium hover:bg-surface hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
                        href={item.href}
                        key={item.href}
                     >
                        {item.label}
                     </a>
                  ))}
               </nav>
            </aside>

            <div className='grid gap-10'>
               <ReferenceSection
                  description='The source documents converge on a shop operating system, not a decorative landing page. This UI must protect customer identity, measurements, money, status, and WhatsApp policy.'
                  eyebrow='Deep analysis'
                  icon={ClipboardCheck}
                  id='analysis'
                  title='What the docs require'
               >
                  <div className='grid gap-4 md:grid-cols-2' data-stagger>
                     {docInsights.map((item) => {
                        const Icon = item.icon;
                        return (
                           <Card key={item.title}>
                              <CardHeader>
                                 <div className='mb-2 grid size-10 place-items-center rounded-lg bg-accent-faded text-accent-darker'>
                                    <Icon aria-hidden className='size-5' />
                                 </div>
                                 <CardTitle>{item.title}</CardTitle>
                                 <CardDescription>{item.body}</CardDescription>
                              </CardHeader>
                           </Card>
                        );
                     })}
                  </div>
               </ReferenceSection>

               <ReferenceSection
                  description='Phase 02 tokens are CSS variables mapped into Tailwind v4 so future tenant branding can change in one place.'
                  eyebrow='Design tokens'
                  icon={Palette}
                  id='tokens'
                  title='Light-golden token contract'
               >
                  <div className='grid gap-5' data-stagger>
                     {tokenGroups.map((group) => (
                        <section key={group.title}>
                           <h3 className='mb-3 font-display text-2xl font-medium leading-none text-ink-display'>
                              {group.title}
                           </h3>
                           <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                              {group.tokens.map((token) => (
                                 <ColorToken key={token.name} {...token} />
                              ))}
                           </div>
                        </section>
                     ))}
                  </div>
               </ReferenceSection>

               <ReferenceSection
                  description='Cormorant Garamond is the TailorOS display and documentation-heading face. Inter remains the body, label, data, and dense-control face for operational clarity.'
                  eyebrow='Typography'
                  icon={Type}
                  id='typography'
                  title='Readable hierarchy'
               >
                  <div className='grid gap-4 lg:grid-cols-[1fr_18rem]'>
                     <div className='rounded-xl border border-hairline bg-surface p-5'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-ink-muted'>
                           Page heading
                        </p>
                        <h2 className='mt-2 font-display text-5xl font-medium leading-none text-ink-display'>
                           Today dashboard
                        </h2>
                        <p className='mt-4 max-w-2xl text-base leading-7 text-ink-body'>
                           Use direct labels, visible IDs, dates, balances, and
                           status changes. Avoid long prose inside repeated
                           workflow screens.
                        </p>
                     </div>
                     <div className='rounded-xl border border-hairline bg-surface p-5'>
                        <p className='text-xs font-semibold uppercase tracking-wide text-ink-muted'>
                           Compact panel
                        </p>
                        <h3 className='mt-2 font-display text-3xl font-medium leading-none text-ink-display'>
                           Ready for pickup
                        </h3>
                        <p className='mt-3 text-sm leading-6 text-ink-body'>
                           Small headings stay small so dense shop data remains
                           scannable on mobile and desktop.
                        </p>
                     </div>
                  </div>
               </ReferenceSection>

               <ReferenceSection
                  description='These primitives are the API for feature work. Add missing UI states here before repeating one-off markup in routes.'
                  eyebrow='Primitives'
                  icon={Layers3}
                  id='primitives'
                  title='Owned shadcn-style components'
               >
                  <div className='grid gap-5 xl:grid-cols-2'>
                     <PreviewPanel title='Buttons, loading, and badges'>
                        <div className='flex flex-wrap gap-3'>
                           <Button>Book order</Button>
                           <Button variant='secondary'>Save draft</Button>
                           <Button isLoading>Saving</Button>
                           <Button variant='destructive'>Cancel order</Button>
                        </div>
                        <div className='mt-4 flex flex-wrap gap-2'>
                           <Badge>Default</Badge>
                           <Badge variant='signal'>Due today</Badge>
                           <Badge variant='success'>Paid</Badge>
                           <Badge variant='whatsapp'>Read</Badge>
                        </div>
                     </PreviewPanel>

                     <PreviewPanel title='Fields and search'>
                        <div className='grid gap-4'>
                           <SearchField
                              aria-label='Search customers and orders'
                              defaultValue='TX-ORD-1042'
                           />
                           <div className='grid gap-2'>
                              <Label htmlFor='customer-name'>
                                 Customer name
                              </Label>
                              <Input
                                 id='customer-name'
                                 defaultValue='Meena Ravi'
                              />
                           </div>
                           <div className='grid gap-2'>
                              <Label htmlFor='garment-type'>Garment type</Label>
                              <Select defaultValue='blouse' id='garment-type'>
                                 <option value='blouse'>Blouse</option>
                                 <option value='sherwani'>Sherwani</option>
                                 <option value='alteration'>Alteration</option>
                              </Select>
                           </div>
                           <Textarea
                              aria-label='Fit notes'
                              defaultValue='Keep sleeve slightly loose near elbow.'
                           />
                        </div>
                     </PreviewPanel>

                     <PreviewPanel title='Dialog and dropdown'>
                        <div className='flex flex-wrap gap-3'>
                           <Dialog>
                              <DialogTrigger
                                 className={cn(
                                    buttonVariants({ variant: "outline" }),
                                 )}
                              >
                                 Preview receipt
                              </DialogTrigger>
                              <DialogContent>
                                 <DialogHeader>
                                    <DialogTitle>Receipt generated</DialogTitle>
                                    <DialogDescription>
                                       Payment is recorded. Receipt sharing can
                                       run through TailorOS now and WhatsApp
                                       Connector later.
                                    </DialogDescription>
                                 </DialogHeader>
                                 <ReceiptPreview
                                    balanceDue={1800}
                                    customerName='Meena Ravi'
                                    orderId='TX-ORD-1042'
                                    paidAmount={2200}
                                    receiptId='TX-RCP-781'
                                    status='partial'
                                 />
                                 <DialogFooter>
                                    <DialogClose
                                       className={cn(
                                          buttonVariants({
                                             variant: "secondary",
                                          }),
                                       )}
                                    >
                                       Close
                                    </DialogClose>
                                    <Button>Share receipt</Button>
                                 </DialogFooter>
                              </DialogContent>
                           </Dialog>

                           <DropdownMenu>
                              <DropdownMenuTrigger
                                 className={cn(
                                    buttonVariants({ variant: "secondary" }),
                                 )}
                              >
                                 More actions
                                 <ChevronDown aria-hidden className='size-4' />
                              </DropdownMenuTrigger>
                              <DropdownMenuPopup>
                                 <DropdownMenuItem>
                                    Print receipt
                                 </DropdownMenuItem>
                                 <DropdownMenuItem>
                                    Copy order ID
                                 </DropdownMenuItem>
                                 <DropdownMenuItem disabled>
                                    Send marketing
                                 </DropdownMenuItem>
                              </DropdownMenuPopup>
                           </DropdownMenu>
                        </div>
                     </PreviewPanel>

                     <PreviewPanel title='Loading and empty states'>
                        <div className='grid gap-3'>
                           <Skeleton className='h-11' />
                           <Skeleton className='h-20' />
                           <Callout variant='warning'>
                              No exact customer match. Check family profiles
                              before creating a duplicate record.
                           </Callout>
                        </div>
                     </PreviewPanel>
                  </div>
               </ReferenceSection>

               <ReferenceSection
                  description='Business components can accept domain-shaped props, but they stay presentation-only. Data fetching and mutation side effects belong in feature hooks.'
                  eyebrow='Business UI'
                  icon={Workflow}
                  id='business-ui'
                  title='TailorOS operating patterns'
               >
                  <div className='grid gap-5 xl:grid-cols-[1fr_0.9fr]'>
                     <div className='grid gap-4'>
                        <CustomerProfileChip
                           activeOrderCount={2}
                           customerId='CUS-MDU-0042'
                           lastOrderLabel='Last blouse order'
                           mobileLabel='+91 98765 43210'
                           name='Meena Ravi'
                           relationLabel='Self / family primary'
                        />
                        <div className='grid gap-3 sm:grid-cols-3'>
                           <MeasurementField
                              label='Chest'
                              unit='in'
                              value='36.5'
                           />
                           <MeasurementField
                              label='Sleeve'
                              previousValue='16.0 in'
                              unit='in'
                              value='16.5'
                              warning='Changed for this order'
                           />
                           <MeasurementField
                              label='Length'
                              unit='in'
                              value='28.0'
                           />
                        </div>
                        <OrderStatusTimeline steps={timelineSteps} />
                     </div>
                     <div className='grid gap-4'>
                        <ReceiptPreview
                           balanceDue={1800}
                           customerName='Meena Ravi'
                           orderId='TX-ORD-1042'
                           paidAmount={2200}
                           receiptId='TX-RCP-781'
                           status='partial'
                        />
                        <div className='rounded-xl border border-hairline bg-surface p-4'>
                           <h3 className='font-display text-2xl font-medium leading-none text-ink-display'>
                              WhatsApp delivery states
                           </h3>
                           <div className='mt-4 flex flex-wrap gap-2'>
                              <WhatsAppDeliveryBadge state='queued' />
                              <WhatsAppDeliveryBadge state='sent' />
                              <WhatsAppDeliveryBadge state='delivered' />
                              <WhatsAppDeliveryBadge state='read' />
                              <WhatsAppDeliveryBadge state='failed' />
                              <WhatsAppDeliveryBadge state='opted-out' />
                           </div>
                        </div>
                     </div>
                  </div>
               </ReferenceSection>

               <ReferenceSection
                  description='Motion confirms action and clarifies state. It should not decorate every row or delay counter workflows.'
                  eyebrow='Micro-interactions'
                  icon={MousePointer2}
                  id='motion'
                  title='Fast, transform-only motion'
               >
                  <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                     {motionRules.map((item) => (
                        <div
                           className='rounded-xl border border-hairline bg-surface p-4 shadow-sm'
                           key={item.label}
                        >
                           <p className='text-sm font-semibold text-ink-display'>
                              {item.label}
                           </p>
                           <p className='mt-2 text-sm leading-6 text-ink-muted'>
                              {item.value}
                           </p>
                        </div>
                     ))}
                  </div>
                  <Callout className='mt-5' variant='info'>
                     `SmoothScrollProvider`, `AnimationProvider`, route
                     templates, buttons, dialogs, and dropdowns all respect
                     reduced-motion preference and keep animations to opacity or
                     transform.
                  </Callout>
               </ReferenceSection>

               <ReferenceSection
                  description='Phase 02 establishes boundaries for server state, UI state, forms, optimistic updates, and performance.'
                  eyebrow='Frontend state'
                  icon={CreditCard}
                  id='state'
                  title='Data and form rules'
               >
                  <div className='grid gap-4 md:grid-cols-2'>
                     {[
                        [
                           "TanStack Query",
                           "Server state only: search, orders, customers, messages, reports.",
                        ],
                        [
                           "Zustand",
                           "Local UI only: command palette, selected row, drawer state, drafts.",
                        ],
                        [
                           "React Hook Form + Zod",
                           "Fast client validation with trusted server validation at the boundary.",
                        ],
                        [
                           "Optimistic updates",
                           "Safe for status changes, never for payment totals without reconciliation.",
                        ],
                     ].map(([title, body]) => (
                        <div
                           className='rounded-xl border border-hairline bg-surface p-4 shadow-sm'
                           key={title}
                        >
                           <h3 className='font-display text-2xl font-medium leading-none text-ink-display'>
                              {title}
                           </h3>
                           <p className='mt-2 text-sm leading-6 text-ink-muted'>
                              {body}
                           </p>
                        </div>
                     ))}
                  </div>
                  <div className='mt-5 rounded-xl border border-hairline bg-surface p-4'>
                     <h3 className='font-display text-2xl font-medium leading-none text-ink-display'>
                        Component rules
                     </h3>
                     <ul className='mt-3 grid gap-2 text-sm leading-6 text-ink-body'>
                        {componentRules.map((rule) => (
                           <li className='flex gap-2' key={rule}>
                              <CheckCircle2
                                 aria-hidden
                                 className='mt-1 size-4 shrink-0 text-state-success'
                              />
                              <span>{rule}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </ReferenceSection>

               <ReferenceSection
                  description='These are the edge cases that make TailorOS more trustworthy than a generic billing or CRM app.'
                  eyebrow='Quality gates'
                  icon={ShieldCheck}
                  id='edge-cases'
                  title='Edge cases covered by the UI foundation'
               >
                  <div className='grid gap-3'>
                     {edgeCases.map((item) => (
                        <div
                           className='flex gap-3 rounded-xl border border-hairline bg-surface p-4'
                           key={item}
                        >
                           <ShieldCheck
                              aria-hidden
                              className='mt-0.5 size-5 shrink-0 text-accent'
                           />
                           <p className='text-sm leading-6 text-ink-body'>
                              {item}
                           </p>
                        </div>
                     ))}
                  </div>
               </ReferenceSection>

               <ReferenceSection
                  description='The checklist is intentionally visible here so every later phase can verify it before shipping new screens.'
                  eyebrow='Exit checklist'
                  icon={Sparkles}
                  id='completion'
                  title='Phase 02 completion status'
               >
                  <div className='grid gap-3'>
                     {[
                        "Light-golden theme tokens are available as CSS variables and Tailwind utilities.",
                        "Reusable primitives cover buttons, forms, cards, dialogs, dropdowns, search, badges, skeletons, callouts, and status chips.",
                        "Business UI examples cover customer identity, measurements, order timeline, receipt, and WhatsApp delivery state.",
                        "Micro-interactions use transform/opacity and reduced-motion guards.",
                        "Theme scanner enforces semantic tokens outside globals.css.",
                     ].map((item) => (
                        <div
                           className='flex items-start gap-3 rounded-xl border border-hairline bg-surface p-4'
                           key={item}
                        >
                           <CheckCircle2
                              aria-hidden
                              className='mt-0.5 size-5 shrink-0 text-state-success'
                           />
                           <p className='text-sm leading-6 text-ink-body'>
                              {item}
                           </p>
                        </div>
                     ))}
                  </div>
                  <a
                     className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline'
                     href='/docs/phase-wise/Phase02_design_system_ui_foundation.html'
                  >
                     Open original Phase 02 source
                     <ArrowUpRight aria-hidden className='size-4' />
                  </a>
               </ReferenceSection>
            </div>
         </div>
      </main>
   );
}

type ReferenceSectionProps = {
   children: React.ReactNode;
   description: string;
   eyebrow: string;
   icon: typeof Palette;
   id: string;
   title: string;
};

function ReferenceSection({
   children,
   description,
   eyebrow,
   icon: Icon,
   id,
   title,
}: ReferenceSectionProps) {
   return (
      <section className='scroll-mt-24' id={id}>
         <div className='mb-5 flex items-start gap-4'>
            <div className='grid size-11 shrink-0 place-items-center rounded-xl border border-hairline bg-surface text-accent shadow-sm'>
               <Icon aria-hidden className='size-5' />
            </div>
            <div>
               <p className='text-xs font-semibold uppercase tracking-wide text-ink-muted'>
                  {eyebrow}
               </p>
               <h2 className='mt-1 font-display text-3xl font-semibold leading-none text-ink-display sm:text-4xl'>
                  {title}
               </h2>
               <p className='mt-2 max-w-3xl text-sm leading-6 text-ink-body'>
                  {description}
               </p>
            </div>
         </div>
         {children}
      </section>
   );
}

type ColorTokenProps = {
   className: string;
   name: string;
   value: string;
};

function ColorToken({ className, name, value }: ColorTokenProps) {
   return (
      <div className='rounded-xl border border-hairline bg-surface p-3 shadow-sm'>
         <div
            className={cn("h-16 rounded-lg border border-hairline", className)}
         />
         <div className='mt-3 flex items-center justify-between gap-3'>
            <strong className='truncate text-sm text-ink-display'>
               {name}
            </strong>
            <span className='text-xs font-medium text-ink-muted'>{value}</span>
         </div>
      </div>
   );
}

function PreviewPanel({
   children,
   title,
}: {
   children: React.ReactNode;
   title: string;
}) {
   return (
      <section className='rounded-xl border border-hairline bg-surface p-5 shadow-sm'>
         <h3 className='mb-4 font-display text-2xl font-medium leading-none text-ink-display'>
            {title}
         </h3>
         {children}
      </section>
   );
}
