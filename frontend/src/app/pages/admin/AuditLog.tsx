import { FileDown, Search, Filter, Calendar, RefreshCw, Shield, AlertTriangle, Info, CheckCircle2, XCircle, Eye, User, Edit, Trash2, Plus, Download, LogIn, LogOut, Settings, MapPin, FileText, ChevronDown, ChevronUp, Users, Activity, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { auditLogService } from '../../../services/admin.service';

type LogLevel = 'info' | 'warning' | 'error' | 'critical';
type ActionType = 'login' | 'logout' | 'create' | 'edit' | 'delete' | 'export' | 'view' | 'config' | 'assign';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: ActionType;
  actionLabel: string;
  target: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failed';
  level: LogLevel;
  sessionId: string;
  userAgent?: string;
  changes?: { field: string; oldValue: string; newValue: string }[];
}

// Map API response to UI shape
function mapApiLog(raw: any): AuditLogEntry {
  const modelName = raw.auditable_type ? raw.auditable_type.split('\\').pop() : '不明';
  const actionLabelMap: Record<string, string> = {
    create: '作成', update: '更新', delete: '削除', edit: '編集',
    login: 'ログイン', logout: 'ログアウト', export: 'エクスポート',
    view: '閲覧', config: '設定変更', assign: '割り当て',
  };
  const changes: AuditLogEntry['changes'] = [];
  if (raw.old_values && raw.new_values) {
    Object.keys(raw.new_values).forEach((field) => {
      if (raw.old_values[field] !== raw.new_values[field]) {
        changes.push({ field, oldValue: String(raw.old_values[field] ?? ''), newValue: String(raw.new_values[field] ?? '') });
      }
    });
  }
  const level: LogLevel = raw.action === 'delete' ? 'warning' : 'info';
  return {
    id: String(raw.id),
    timestamp: raw.created_at ? new Date(raw.created_at).toLocaleString('ja-JP') : '',
    user: raw.user?.name ?? 'システム',
    userId: String(raw.user?.id ?? 'system'),
    action: (raw.action as ActionType) ?? 'view',
    actionLabel: actionLabelMap[raw.action] ?? raw.action,
    target: `${modelName} #${raw.auditable_id ?? ''}`,
    details: changes.length > 0 ? `${changes.length}件の変更` : raw.action,
    ipAddress: raw.ip_address ?? '--',
    status: 'success',
    level,
    sessionId: '',
    userAgent: raw.user_agent,
    changes: changes.length > 0 ? changes : undefined,
  };
}

export function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAction, setSelectedAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Real API query
  const { data: apiResult, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', selectedAction, startDate, endDate, currentPage],
    queryFn: () => auditLogService.getList({
      action: selectedAction !== 'all' ? selectedAction : undefined,
      from: startDate || undefined,
      to: endDate || undefined,
      page: currentPage,
    }),
  });

  const logs = useMemo(
    () => (apiResult?.data ?? []).map(mapApiLog),
    [apiResult]
  );
  const totalPages = apiResult?.meta?.last_page ?? 1;

  // Client-side search filter
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) =>
      log.user.toLowerCase().includes(q) ||
      log.actionLabel.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  const paginatedLogs = filteredLogs;

  // Calculate stats from current page
  const stats = {
    totalToday: apiResult?.meta?.total ?? 0,
    failed: 0,
    uniqueUsers: new Set(logs.map((l) => l.userId)).size,
    critical: 0,
  };

  // Export CSV via real API
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await auditLogService.exportCsv();
    } catch {
      toast.error('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  // Client-side only filters (no server-side equivalent)
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const uniqueUsers = useMemo(() => Array.from(new Set(logs.map((l) => l.user))), [logs]);

  // Get icon for action type
  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case 'login': return <LogIn size={16} />;
      case 'logout': return <LogOut size={16} />;
      case 'create': return <Plus size={16} />;
      case 'edit': return <Edit size={16} />;
      case 'delete': return <Trash2 size={16} />;
      case 'export': return <Download size={16} />;
      case 'view': return <Eye size={16} />;
      case 'config': return <Settings size={16} />;
      case 'assign': return <Users size={16} />;
      default: return <Activity size={16} />;
    }
  };

  // Get level badge
  const getLevelBadge = (level: LogLevel) => {
    const configs = {
      info: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Info size={12} />, label: '情報' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <AlertTriangle size={12} />, label: '警告' },
      error: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={12} />, label: 'エラー' },
      critical: { bg: 'bg-purple-100', text: 'text-purple-700', icon: <AlertCircle size={12} />, label: '重大' },
    };
    const config = configs[level];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield size={28} className="text-[var(--color-primary-500)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">操作ログ</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            更新
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-600)] flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            CSV出力
          </button>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">本日の操作数</div>
            <Activity size={20} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalToday}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">過去24時間</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">失敗操作</div>
            <XCircle size={20} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">要確認</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">アクティブユーザー</div>
            <Users size={20} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.uniqueUsers}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">ユニークユーザー</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[var(--border-default)] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">重大イベント</div>
            <AlertCircle size={20} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-purple-600">{stats.critical}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">即座対応必要</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 border border-[var(--border-default)] space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="ユーザー・操作・詳細で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 border border-[var(--border-default)] rounded-lg px-3 py-2">
            <Calendar size={16} className="text-[var(--text-secondary)]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm focus:outline-none"
            />
            <span className="text-[var(--text-secondary)]">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm focus:outline-none"
            />
          </div>

          {/* Filter Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters
                ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                : 'text-[var(--text-secondary)] bg-white border-[var(--border-default)] hover:bg-[var(--color-gray-50)]'
            }`}
          >
            <Filter size={16} />
            フィルター
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-default)]">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">ユーザー</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="all">全ユーザー</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">操作種別</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="all">全操作</option>
                <option value="login">ログイン</option>
                <option value="logout">ログアウト</option>
                <option value="create">作成</option>
                <option value="edit">編集</option>
                <option value="delete">削除</option>
                <option value="export">出力</option>
                <option value="config">設定変更</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">ステータス</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="all">全て</option>
                <option value="success">成功</option>
                <option value="failed">失敗</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">レベル</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                <option value="all">全レベル</option>
                <option value="info">情報</option>
                <option value="warning">警告</option>
                <option value="error">エラー</option>
                <option value="critical">重大</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-[var(--text-secondary)]">
          {filteredLogs.length}件の操作ログ
          {filteredLogs.length !== logs.length && ` (${logs.length}中)`}
        </div>
        <div className="text-[var(--text-secondary)]">
          ページ {currentPage} / {totalPages}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-gray-50)] border-b border-[var(--border-default)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] w-[140px]">日時</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">操作者</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">操作</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">対象</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)]">詳細</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-secondary)]">IP</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-secondary)]">レベル</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] w-[80px]">状態</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] w-[60px]">詳細</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className={`border-b border-[var(--border-default)] hover:bg-[var(--color-gray-50)] transition-colors ${
                      log.level === 'critical' ? 'bg-purple-50/30' : log.level === 'error' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {log.user.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{log.user}</div>
                          <div className="text-xs text-[var(--text-muted)]">{log.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="text-[var(--color-primary-500)]">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-sm text-[var(--text-primary)]">{log.actionLabel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{log.target}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-[300px] truncate">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] font-mono">
                        <MapPin size={12} />
                        {log.ipAddress}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getLevelBadge(log.level)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle2 size={12} />
                          成功
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle size={12} />
                          失敗
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="p-1 text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] rounded"
                      >
                        {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>
                  {expandedLog === log.id && (
                    <tr className="bg-[var(--color-gray-50)]/50">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">セッションID</div>
                              <div className="text-sm text-[var(--text-primary)] font-mono">{log.sessionId}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">IPアドレス</div>
                              <div className="text-sm text-[var(--text-primary)] font-mono">{log.ipAddress}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">詳細情報</div>
                            <div className="text-sm text-[var(--text-primary)] p-3 bg-white rounded border border-[var(--border-default)]">
                              {log.details}
                            </div>
                          </div>
                          {log.changes && log.changes.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2">変更内容</div>
                              <div className="space-y-2">
                                {log.changes.map((change, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-white rounded border border-[var(--border-default)]">
                                    <span className="font-medium text-[var(--text-primary)]">{change.field}:</span>
                                    <span className="text-red-600 line-through">{change.oldValue}</span>
                                    <span className="text-[var(--text-secondary)]">→</span>
                                    <span className="text-green-600 font-medium">{change.newValue}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)]">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNum
                        ? 'bg-[var(--color-primary-500)] text-white font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--color-gray-100)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-[var(--border-default)] rounded-lg hover:bg-[var(--color-gray-50)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}