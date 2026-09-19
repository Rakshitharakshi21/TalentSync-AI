'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { Map as MapIcon, Loader2, RefreshCw } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'employee' | 'skill' | 'project' | 'capability' | 'role';
  x: number;
  y: number;
  color: string;
}

interface GraphEdge {
  from: string;
  to: string;
}

export default function CapabilityMapPage() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      let employees: any[] = [];
      
      if (userRole === 'hr') {
        const { data } = await supabase.from('employee_profiles').select('*, profiles!inner(full_name)');
        employees = data || [];
      } else {
        const { data } = await supabase.from('employee_profiles').select('*, profiles!inner(full_name)').eq('user_id', user!.id);
        employees = data || [];
      }

      const allNodes: GraphNode[] = [];
      const allEdges: GraphEdge[] = [];
      const skillMap = new Map<string, string>();
      const capabilityMap = new Map<string, string>();
      const roleMap = new Map<string, string>();

      for (const emp of employees) {
        const empNodeId = `emp-${emp.id}`;
        allNodes.push({
          id: empNodeId,
          label: emp.profiles?.full_name || 'Unknown',
          type: 'employee',
          x: 0, y: 0,
          color: '#6366f1',
        });

        // Skills
        const { data: skills } = await supabase.from('skills').select('*').eq('employee_id', emp.id);
        for (const skill of (skills || [])) {
          const skillId = `skill-${skill.name.toLowerCase().replace(/\s+/g, '-')}`;
          if (!skillMap.has(skillId)) {
            skillMap.set(skillId, skill.name);
            allNodes.push({ id: skillId, label: skill.name, type: 'skill', x: 0, y: 0, color: '#10b981' });
          }
          allEdges.push({ from: empNodeId, to: skillId });
        }

        // Projects
        const { data: projects } = await supabase.from('projects').select('*').eq('employee_id', emp.id);
        for (const proj of (projects || [])) {
          const projId = `proj-${proj.id}`;
          allNodes.push({ id: projId, label: proj.name, type: 'project', x: 0, y: 0, color: '#f59e0b' });
          allEdges.push({ from: empNodeId, to: projId });

          // Connect project technologies to skills
          for (const tech of (proj.technologies || [])) {
            const techId = `skill-${tech.toLowerCase().replace(/\s+/g, '-')}`;
            if (!skillMap.has(techId)) {
              skillMap.set(techId, tech);
              allNodes.push({ id: techId, label: tech, type: 'skill', x: 0, y: 0, color: '#10b981' });
            }
            allEdges.push({ from: projId, to: techId });
          }
        }

        // Hidden capabilities from insights
        const { data: insights } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('type', 'hidden_capabilities')
          .single();

        if (insights?.data?.capabilities) {
          for (const cap of insights.data.capabilities) {
            const capId = `cap-${cap.capability.toLowerCase().replace(/\s+/g, '-')}`;
            if (!capabilityMap.has(capId)) {
              capabilityMap.set(capId, cap.capability);
              allNodes.push({ id: capId, label: cap.capability, type: 'capability', x: 0, y: 0, color: '#8b5cf6' });
            }
            allEdges.push({ from: empNodeId, to: capId });

            // Connect capabilities to potential roles
            for (const role of (cap.potential_roles || [])) {
              const roleId = `role-${role.toLowerCase().replace(/\s+/g, '-')}`;
              if (!roleMap.has(roleId)) {
                roleMap.set(roleId, role);
                allNodes.push({ id: roleId, label: role, type: 'role', x: 0, y: 0, color: '#ec4899' });
              }
              allEdges.push({ from: capId, to: roleId });
            }
          }
        }
      }

      // Layout: force-directed-like placement
      layoutNodes(allNodes, allEdges);

      setNodes(allNodes);
      setEdges(allEdges);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function layoutNodes(nodes: GraphNode[], edges: GraphEdge[]) {
    if (nodes.length === 0) return;

    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group by type
    const groups: Record<string, GraphNode[]> = {};
    for (const node of nodes) {
      if (!groups[node.type]) groups[node.type] = [];
      groups[node.type].push(node);
    }

    const typeRadii: Record<string, number> = {
      employee: 80,
      skill: 200,
      project: 160,
      capability: 250,
      role: 300,
    };

    for (const [type, group] of Object.entries(groups)) {
      const radius = typeRadii[type] || 200;
      const angleStep = (2 * Math.PI) / Math.max(group.length, 1);
      const offset = Math.random() * Math.PI; // Slight randomization

      group.forEach((node, i) => {
        const angle = i * angleStep + offset;
        node.x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 30;
        node.y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 30;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-violet-600" />
            Capability Map
          </h1>
          <p className="section-subtitle">Interactive visualization of capabilities, skills, and potential roles</p>
        </div>
        <div className="empty-state card py-20">
          <MapIcon className="w-12 h-12 text-surface-300 mb-4" />
          <h3 className="text-lg font-semibold text-surface-900">No data to visualize</h3>
          <p className="text-surface-500 mt-2 max-w-md">
            Add skills, projects, and run AI analysis to build your capability map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-violet-600" />
          Capability Map
        </h1>
        <p className="section-subtitle">Employee → Skills → Projects → Capabilities → Potential Roles</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { color: 'bg-primary-500', label: 'Employee' },
          { color: 'bg-emerald-500', label: 'Skill' },
          { color: 'bg-amber-500', label: 'Project' },
          { color: 'bg-violet-500', label: 'Capability' },
          { color: 'bg-pink-500', label: 'Role' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-surface-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="card overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          viewBox="0 0 900 600"
          className="bg-surface-50"
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
            return (
              <line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isHighlighted ? '#6366f1' : '#e2e8f0'}
                strokeWidth={isHighlighted ? 2 : 1}
                opacity={hoveredNode ? (isHighlighted ? 1 : 0.15) : 0.5}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const isConnected = hoveredNode && edges.some(
              e => (e.from === hoveredNode && e.to === node.id) || (e.to === hoveredNode && e.from === node.id)
            );
            const dimmed = hoveredNode && !isHovered && !isConnected;
            const size = node.type === 'employee' ? 24 : node.type === 'capability' ? 20 : 16;

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(node)}
                opacity={dimmed ? 0.2 : 1}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? size + 4 : size}
                  fill={node.color}
                  stroke="white"
                  strokeWidth={2}
                  className="transition-all duration-200"
                />
                <text
                  x={node.x}
                  y={node.y + size + 14}
                  textAnchor="middle"
                  fontSize={node.type === 'employee' ? 11 : 9}
                  fontWeight={node.type === 'employee' ? 600 : 400}
                  fill="#475569"
                  className="pointer-events-none"
                >
                  {node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedNode.color }} />
            <div>
              <p className="font-semibold text-surface-900">{selectedNode.label}</p>
              <p className="text-sm text-surface-500 capitalize">{selectedNode.type}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-surface-500 mb-1">Connected to:</p>
            <div className="flex flex-wrap gap-1.5">
              {edges
                .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                .map((e, i) => {
                  const otherId = e.from === selectedNode.id ? e.to : e.from;
                  const other = nodes.find(n => n.id === otherId);
                  return other ? (
                    <span key={i} className="badge-surface">{other.label}</span>
                  ) : null;
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
