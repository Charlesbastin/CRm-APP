import 'package:flutter/material.dart';

void main() => runApp(const TechnoCraftApp());

class TechnoCraftApp extends StatelessWidget {
  const TechnoCraftApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'TechnoCraft',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF6F8FB),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F766E),
          primary: const Color(0xFF0F766E),
          secondary: const Color(0xFFF59E0B),
          surface: Colors.white,
        ),
        fontFamily: 'Roboto',
      ),
      home: const SplashScreen(),
    );
  }
}

class TcColors {
  static const ink = Color(0xFF111827);
  static const muted = Color(0xFF64748B);
  static const teal = Color(0xFF0F766E);
  static const tealDark = Color(0xFF0B3B36);
  static const gold = Color(0xFFF59E0B);
  static const blue = Color(0xFF2563EB);
  static const red = Color(0xFFDC2626);
  static const line = Color(0xFFE2E8F0);
}

class EventItem {
  const EventItem({
    required this.title,
    required this.category,
    required this.date,
    required this.time,
    required this.venue,
    required this.price,
    required this.seats,
    required this.color,
  });

  final String title;
  final String category;
  final String date;
  final String time;
  final String venue;
  final int price;
  final int seats;
  final Color color;
}

const events = [
  EventItem(
    title: 'Hack Sprint',
    category: 'Technical',
    date: 'Jul 18',
    time: '10:00 AM',
    venue: 'Innovation Lab',
    price: 150,
    seats: 42,
    color: TcColors.teal,
  ),
  EventItem(
    title: 'Career Lab',
    category: 'Non-Technical',
    date: 'Jul 29',
    time: '2:00 PM',
    venue: 'Placement Hall',
    price: 120,
    seats: 28,
    color: TcColors.blue,
  ),
  EventItem(
    title: 'Stage Night',
    category: 'Cultural',
    date: 'Jul 22',
    time: '6:30 PM',
    venue: 'Open Air Theater',
    price: 0,
    seats: 180,
    color: TcColors.gold,
  ),
];

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TcColors.tealDark,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              const TechnoCraftLogo(size: 88),
              const SizedBox(height: 24),
              const Text(
                'TECHNOCRAFT',
                style: TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w900, letterSpacing: 1.2),
              ),
              const Text(
                '2026 Campus Events',
                style: TextStyle(color: Color(0xFFBDEFE7), fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 18),
              const Text(
                'Discover events, register, get QR passes, and manage live check-ins.',
                style: TextStyle(color: Color(0xFFD7F7F2), fontSize: 15, height: 1.5),
              ),
              const Spacer(),
              FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54), backgroundColor: TcColors.gold),
                onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                child: const Text('Get started', style: TextStyle(color: TcColors.ink, fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String role = 'Student';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const BrandLockup(),
              const SizedBox(height: 36),
              const Text('Choose your workspace', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: TcColors.ink)),
              const SizedBox(height: 8),
              const Text('Secure Firebase login for students, coordinators, and admin.', style: TextStyle(color: TcColors.muted, height: 1.45)),
              const SizedBox(height: 24),
              Row(
                children: ['Student', 'Coordinator', 'Admin'].map((item) {
                  final active = item == role;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        selected: active,
                        label: Text(item),
                        onSelected: (_) => setState(() => role = item),
                        selectedColor: TcColors.teal,
                        labelStyle: TextStyle(color: active ? Colors.white : TcColors.ink, fontWeight: FontWeight.w800),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 22),
              const TcTextField(label: 'Email / Student ID', hint: 'student@campus.edu'),
              const SizedBox(height: 14),
              const TcTextField(label: 'Password', hint: 'Enter password', obscure: true),
              const SizedBox(height: 24),
              FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54), backgroundColor: TcColors.teal),
                onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentHomeScreen())),
                child: Text('Continue as $role', style: const TextStyle(fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class StudentHomeScreen extends StatefulWidget {
  const StudentHomeScreen({super.key});

  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  int tab = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const EventDiscoveryPage(),
      const EventListPage(),
      const QrPassPage(),
      const ProfilePage(),
    ];
    return Scaffold(
      body: SafeArea(child: pages[tab]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (value) => setState(() => tab = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.event_outlined), selectedIcon: Icon(Icons.event), label: 'Events'),
          NavigationDestination(icon: Icon(Icons.qr_code_2), label: 'QR'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class EventDiscoveryPage extends StatelessWidget {
  const EventDiscoveryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const HeaderBar(title: 'Discover events', subtitle: 'Find your next TechnoCraft activity.'),
        const SizedBox(height: 18),
        const SearchBar(leading: Icon(Icons.search), hintText: 'Search events, venue, category'),
        const SizedBox(height: 16),
        SizedBox(
          height: 36,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: const [
              FilterPill(label: 'All', active: true),
              FilterPill(label: 'Technical'),
              FilterPill(label: 'Non-Technical'),
              FilterPill(label: 'Cultural'),
              FilterPill(label: 'Sports'),
            ],
          ),
        ),
        const SizedBox(height: 18),
        FeaturedEventCard(event: events.first),
        const SizedBox(height: 18),
        const SectionTitle('My registrations'),
        const RegistrationTile(title: 'Stage Night', status: 'Approved', color: TcColors.teal),
        const RegistrationTile(title: 'Hack Sprint', status: 'Pending', color: TcColors.gold),
        const SizedBox(height: 18),
        const SectionTitle('Recommended'),
        ...events.map((event) => EventCard(event: event)),
      ],
    );
  }
}

class EventListPage extends StatelessWidget {
  const EventListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const HeaderBar(title: 'Events', subtitle: 'Schedule, rules, fee, venue, and registration.'),
        const SizedBox(height: 16),
        ...events.map((event) => EventCard(
              event: event,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailsPage(event: event))),
            )),
      ],
    );
  }
}

class EventDetailsPage extends StatelessWidget {
  const EventDetailsPage({super.key, required this.event});

  final EventItem event;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            IconButton.filledTonal(
              alignment: Alignment.centerLeft,
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back),
            ),
            const SizedBox(height: 12),
            HeroPanel(event: event),
            const SizedBox(height: 18),
            InfoGrid(event: event),
            const SizedBox(height: 18),
            const DetailBlock(title: 'Schedule', body: 'Briefing → Build sprint → Mentor review → Demo showcase'),
            const DetailBlock(title: 'Rules', body: 'Teams of 2-4. Bring laptops. Final demo is mandatory. Registration closes one day before event.'),
            const SizedBox(height: 12),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54), backgroundColor: TcColors.teal),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CheckoutPage(event: event))),
              child: Text(event.price == 0 ? 'Register free' : 'Register and pay Rs ${event.price}', style: const TextStyle(fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    );
  }
}

class CheckoutPage extends StatelessWidget {
  const CheckoutPage({super.key, required this.event});

  final EventItem event;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registration checkout')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          EventCard(event: event),
          const SizedBox(height: 16),
          const TcTextField(label: 'Team name', hint: 'Prompt Pilots'),
          const SizedBox(height: 12),
          const TcTextField(label: 'Document / portfolio link', hint: 'drive.google.com/...'),
          const SizedBox(height: 16),
          PaymentSummary(price: event.price),
          const SizedBox(height: 18),
          FilledButton(
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54), backgroundColor: TcColors.gold),
            onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const StudentHomeScreen())),
            child: const Text('Confirm registration', style: TextStyle(color: TcColors.ink, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }
}

class QrPassPage extends StatelessWidget {
  const QrPassPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: const [
        HeaderBar(title: 'QR Pass', subtitle: 'Approved event tickets for venue entry.'),
        SizedBox(height: 18),
        TicketCard(),
      ],
    );
  }
}

class CoordinatorQueueScreen extends StatelessWidget {
  const CoordinatorQueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            HeaderBar(title: 'Approval queue', subtitle: 'Fast scan view for Pending, Approved, and Rejected.'),
            SizedBox(height: 14),
            Row(children: [FilterPill(label: 'Pending', active: true), FilterPill(label: 'Approved'), FilterPill(label: 'Rejected')]),
            SizedBox(height: 18),
            ApprovalTile(name: 'Aarav Mehta', event: 'Hack Sprint', status: 'Pending'),
            ApprovalTile(name: 'Divya Kumar', event: 'Career Lab', status: 'Pending'),
            ApprovalTile(name: 'Nisha Rao', event: 'Stage Night', status: 'Approved'),
          ],
        ),
      ),
    );
  }
}

class ScannerScreen extends StatelessWidget {
  const ScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TcColors.tealDark,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const HeaderBar(title: 'Live check-in', subtitle: 'Scan QR pass at the venue gate.', dark: true),
              const Spacer(),
              Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: Colors.white, width: 4),
                ),
                child: const Icon(Icons.qr_code_scanner, size: 120, color: Colors.white),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54), backgroundColor: TcColors.gold),
                onPressed: () {},
                icon: const Icon(Icons.flash_on, color: TcColors.ink),
                label: const Text('Start scanner', style: TextStyle(color: TcColors.ink, fontWeight: FontWeight.w900)),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            HeaderBar(title: 'Control room', subtitle: 'Compact analytics and management tables.'),
            SizedBox(height: 18),
            Row(
              children: [
                Expanded(child: MetricCard(label: 'Events', value: '24')),
                SizedBox(width: 10),
                Expanded(child: MetricCard(label: 'Users', value: '1.2k')),
              ],
            ),
            SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: MetricCard(label: 'Revenue', value: 'Rs 42k')),
                SizedBox(width: 10),
                Expanded(child: MetricCard(label: 'Check-ins', value: '684')),
              ],
            ),
            SizedBox(height: 18),
            ApprovalTile(name: 'Coordinator: Nisha', event: 'Technical events', status: 'Active'),
            ApprovalTile(name: 'Coordinator: Kavin', event: 'Cultural events', status: 'Review'),
          ],
        ),
      ),
    );
  }
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const HeaderBar(title: 'Profile', subtitle: 'Account, certificates, and logout.'),
        const SizedBox(height: 18),
        const CardShell(
          child: ListTile(
            leading: CircleAvatar(backgroundColor: TcColors.teal, child: Text('AM', style: TextStyle(color: Colors.white))),
            title: Text('Aarav Mehta', style: TextStyle(fontWeight: FontWeight.w900)),
            subtitle: Text('student@campus.edu'),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
          icon: const Icon(Icons.logout),
          label: const Text('Sign out'),
        ),
      ],
    );
  }
}

class TechnoCraftLogo extends StatelessWidget {
  const TechnoCraftLogo({super.key, this.size = 52});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: TcColors.ink,
        borderRadius: BorderRadius.circular(size * 0.25),
        border: Border.all(color: TcColors.teal.withOpacity(0.6), width: 2),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.shield, color: TcColors.teal, size: size * 0.68),
          Text('T', style: TextStyle(color: Colors.white, fontSize: size * 0.42, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class BrandLockup extends StatelessWidget {
  const BrandLockup({super.key});

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        TechnoCraftLogo(),
        SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('TECHNOCRAFT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 1)),
            Text('2026 campus events', style: TextStyle(color: TcColors.muted, fontWeight: FontWeight.w700)),
          ],
        ),
      ],
    );
  }
}

class HeaderBar extends StatelessWidget {
  const HeaderBar({super.key, required this.title, required this.subtitle, this.dark = false});

  final String title;
  final String subtitle;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: dark ? Colors.white : TcColors.ink)),
        const SizedBox(height: 4),
        Text(subtitle, style: TextStyle(color: dark ? const Color(0xFFBDEFE7) : TcColors.muted, height: 1.4)),
      ],
    );
  }
}

class FilterPill extends StatelessWidget {
  const FilterPill({super.key, required this.label, this.active = false});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Chip(
        backgroundColor: active ? TcColors.teal : Colors.white,
        side: BorderSide(color: active ? TcColors.teal : TcColors.line),
        label: Text(label, style: TextStyle(color: active ? Colors.white : TcColors.ink, fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(text, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: TcColors.ink)),
    );
  }
}

class FeaturedEventCard extends StatelessWidget {
  const FeaturedEventCard({super.key, required this.event});

  final EventItem event;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: TcColors.tealDark, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FilterPill(label: event.category, active: true),
          const SizedBox(height: 22),
          Text(event.title, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text('${event.date} • ${event.time} • ${event.venue}', style: const TextStyle(color: Color(0xFFCFFAF3))),
          const SizedBox(height: 18),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: TcColors.gold),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailsPage(event: event))),
            child: const Text('View details', style: TextStyle(color: TcColors.ink, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }
}

class EventCard extends StatelessWidget {
  const EventCard({super.key, required this.event, this.onTap});

  final EventItem event;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return CardShell(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(color: event.color.withOpacity(0.12), borderRadius: BorderRadius.circular(16)),
            child: Icon(Icons.event_available, color: event.color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                const SizedBox(height: 4),
                Text('${event.date} • ${event.venue}', style: const TextStyle(color: TcColors.muted)),
              ],
            ),
          ),
          Text(event.price == 0 ? 'Free' : 'Rs ${event.price}', style: const TextStyle(fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class HeroPanel extends StatelessWidget {
  const HeroPanel({super.key, required this.event});

  final EventItem event;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(color: event.color, borderRadius: BorderRadius.circular(28)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(event.category, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          Text(event.title, style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w900)),
          const SizedBox(height: 14),
          Text('${event.seats} seats left', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class InfoGrid extends StatelessWidget {
  const InfoGrid({super.key, required this.event});

  final EventItem event;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: MetricCard(label: 'Date', value: event.date)),
        const SizedBox(width: 10),
        Expanded(child: MetricCard(label: 'Fee', value: event.price == 0 ? 'Free' : 'Rs ${event.price}')),
      ],
    );
  }
}

class DetailBlock extends StatelessWidget {
  const DetailBlock({super.key, required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return CardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(color: TcColors.muted, height: 1.45)),
        ],
      ),
    );
  }
}

class RegistrationTile extends StatelessWidget {
  const RegistrationTile({super.key, required this.title, required this.status, required this.color});

  final String title;
  final String status;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return CardShell(
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
        subtitle: Text(status),
        trailing: Icon(Icons.confirmation_number, color: color),
      ),
    );
  }
}

class PaymentSummary extends StatelessWidget {
  const PaymentSummary({super.key, required this.price});

  final int price;

  @override
  Widget build(BuildContext context) {
    return CardShell(
      child: Column(
        children: [
          SummaryRow(label: 'Event fee', value: price == 0 ? 'Free' : 'Rs $price'),
          const SummaryRow(label: 'Platform fee', value: 'Rs 0'),
          const Divider(),
          SummaryRow(label: 'Total', value: price == 0 ? 'Rs 0' : 'Rs $price', strong: true),
        ],
      ),
    );
  }
}

class SummaryRow extends StatelessWidget {
  const SummaryRow({super.key, required this.label, required this.value, this.strong = false});

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: strong ? TcColors.ink : TcColors.muted, fontWeight: strong ? FontWeight.w900 : FontWeight.w600)),
          Text(value, style: TextStyle(fontWeight: strong ? FontWeight.w900 : FontWeight.w700)),
        ],
      ),
    );
  }
}

class TicketCard extends StatelessWidget {
  const TicketCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: TcColors.line),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 24, offset: const Offset(0, 10))],
      ),
      child: Column(
        children: [
          const Row(
            children: [
              TechnoCraftLogo(size: 44),
              SizedBox(width: 12),
              Expanded(child: Text('Hack Sprint Pass', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900))),
            ],
          ),
          const SizedBox(height: 22),
          Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(color: TcColors.ink, borderRadius: BorderRadius.circular(20)),
            child: const Icon(Icons.qr_code_2, color: Colors.white, size: 145),
          ),
          const SizedBox(height: 18),
          const SummaryRow(label: 'Student', value: 'Aarav Mehta'),
          const SummaryRow(label: 'Venue', value: 'Innovation Lab'),
          const SummaryRow(label: 'Status', value: 'Approved', strong: true),
        ],
      ),
    );
  }
}

class ApprovalTile extends StatelessWidget {
  const ApprovalTile({super.key, required this.name, required this.event, required this.status});

  final String name;
  final String event;
  final String status;

  @override
  Widget build(BuildContext context) {
    return CardShell(
      child: Row(
        children: [
          const CircleAvatar(backgroundColor: Color(0xFFE0F2FE), child: Icon(Icons.person, color: TcColors.blue)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w900)),
                Text(event, style: const TextStyle(color: TcColors.muted)),
              ],
            ),
          ),
          Chip(label: Text(status), backgroundColor: const Color(0xFFFFF7ED)),
        ],
      ),
    );
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return CardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: TcColors.muted, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(color: TcColors.ink, fontSize: 22, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class TcTextField extends StatelessWidget {
  const TcTextField({super.key, required this.label, required this.hint, this.obscure = false});

  final String label;
  final String hint;
  final bool obscure;

  @override
  Widget build(BuildContext context) {
    return TextField(
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: TcColors.line)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: TcColors.line)),
      ),
    );
  }
}

class CardShell extends StatelessWidget {
  const CardShell({super.key, required this.child, this.onTap});

  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: TcColors.line),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 18, offset: const Offset(0, 8))],
      ),
      child: child,
    );
    if (onTap == null) return card;
    return InkWell(onTap: onTap, borderRadius: BorderRadius.circular(20), child: card);
  }
}
