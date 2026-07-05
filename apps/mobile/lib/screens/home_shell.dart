import 'package:flutter/material.dart';

import '../services/data_service.dart';
import 'report_list_screen.dart';
import 'new_report_screen.dart';
import 'map_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  final _data = DataService();

  final _screens = const [
    ReportListScreen(),
    NewReportScreen(),
    MapScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Urbanfix'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: () => _data.signOut(),
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.list_alt), label: 'Reports'),
          NavigationDestination(
              icon: Icon(Icons.add_circle_outline), label: 'Report'),
          NavigationDestination(icon: Icon(Icons.map_outlined), label: 'Map'),
        ],
      ),
    );
  }
}
