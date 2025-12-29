'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OperatorsAPI } from '@/lib/api';
import Icon, { 
  faArrowLeft, 
  faEdit, 
  faTrash,
  faCheck,
  faTimes,
  faBuilding,
  faCog,
  faUsers,
  faTruck,
  faUser,
  faBox,
  faCheckCircle,
  faTimesCircle,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button, LoadingSpinner, ConfirmDialog } from '@/app/components';
import LoadingSpinnerComponent from '@/app/components/LoadingSpinner';

export default function OperatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const operatorId = params?.id as string | undefined;
  const isEditMode = searchParams?.get('edit') === 'true';

  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(isEditMode);
  const [configEditMode, setConfigEditMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
  });

  const [configData, setConfigData] = useState({
    supports_documents: false,
    supports_small_parcel: false,
    supports_electronics: false,
    supports_fragile: false,
    supports_perishables: false,
    supports_bulky: false,
    max_weight_kg: '',
    max_dimensions_cm: '',
    supports_same_day: false,
    supports_next_day: false,
    supports_scheduled: false,
    supports_express: false,
    supports_intercity: false,
    supports_prepaid: true,
    supports_cod: false,
    supports_corporate: false,
  });

  useEffect(() => {
    if (!operatorId) {
      setLoading(false);
      return;
    }

    const fetchOperator = async () => {
      setLoading(true);
      try {
        const operatorData = await OperatorsAPI.getById(operatorId);
        setOperator(operatorData);
        setFormData({
          name: operatorData.name || '',
          email: operatorData.email || '',
          phone: operatorData.phone || '',
          status: operatorData.status || 'ACTIVE',
        });
        if (operatorData.operator_config) {
          const config = operatorData.operator_config;
          setConfigData({
            supports_documents: config.supports_documents || false,
            supports_small_parcel: config.supports_small_parcel || false,
            supports_electronics: config.supports_electronics || false,
            supports_fragile: config.supports_fragile || false,
            supports_perishables: config.supports_perishables || false,
            supports_bulky: config.supports_bulky || false,
            max_weight_kg: config.max_weight_kg || '',
            max_dimensions_cm: config.max_dimensions_cm || '',
            supports_same_day: config.supports_same_day || false,
            supports_next_day: config.supports_next_day || false,
            supports_scheduled: config.supports_scheduled || false,
            supports_express: config.supports_express || false,
            supports_intercity: config.supports_intercity || false,
            supports_prepaid: config.supports_prepaid !== undefined ? config.supports_prepaid : true,
            supports_cod: config.supports_cod || false,
            supports_corporate: config.supports_corporate || false,
          });
        }
      } catch (error: any) {
        console.error('Failed to fetch operator:', error);
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          router.push('/dashboard/operators');
        } else {
          toast.error('Failed to load operator. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOperator();
  }, [operatorId, router]);

  const handleSave = async () => {
    if (!operator || !operatorId) return;

    setSaving(true);
    try {
      await OperatorsAPI.update(operatorId, formData);
      toast.success('Operator updated successfully');
      setEditMode(false);
      // Reload operator
      const operatorData = await OperatorsAPI.getById(operatorId);
      setOperator(operatorData);
    } catch (error: any) {
      console.error('Failed to update operator:', error);
      toast.error(error?.response?.data?.message || 'Failed to update operator');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigSave = async () => {
    if (!operator || !operatorId) return;

    setSaving(true);
    try {
      const configPayload: any = { ...configData };
      if (configPayload.max_weight_kg) {
        configPayload.max_weight_kg = Number(configPayload.max_weight_kg);
      }
      await OperatorsAPI.updateConfig(operatorId, configPayload);
      toast.success('Configuration updated successfully');
      setConfigEditMode(false);
      // Reload operator
      const operatorData = await OperatorsAPI.getById(operatorId);
      setOperator(operatorData);
      if (operatorData.operator_config) {
        const config = operatorData.operator_config;
        setConfigData({
          ...configData,
          supports_documents: config.supports_documents || false,
          supports_small_parcel: config.supports_small_parcel || false,
          supports_electronics: config.supports_electronics || false,
          supports_fragile: config.supports_fragile || false,
          supports_perishables: config.supports_perishables || false,
          supports_bulky: config.supports_bulky || false,
          max_weight_kg: config.max_weight_kg || '',
          max_dimensions_cm: config.max_dimensions_cm || '',
          supports_same_day: config.supports_same_day || false,
          supports_next_day: config.supports_next_day || false,
          supports_scheduled: config.supports_scheduled || false,
          supports_express: config.supports_express || false,
          supports_intercity: config.supports_intercity || false,
          supports_prepaid: config.supports_prepaid !== undefined ? config.supports_prepaid : true,
          supports_cod: config.supports_cod || false,
          supports_corporate: config.supports_corporate || false,
        });
      }
    } catch (error: any) {
      console.error('Failed to update configuration:', error);
      toast.error(error?.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!operator || !operatorId) return;

    setDeleting(true);
    try {
      await OperatorsAPI.delete(operatorId);
      toast.success('Operator deleted successfully');
      router.push('/dashboard/operators');
    } catch (error: any) {
      console.error('Failed to delete operator:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete operator');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinnerComponent text="Loading operator..." />
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Operator not found</p>
        <Link href="/dashboard/operators" className="text-[#0b66c2] hover:text-[#09529a] mt-4 inline-block">
          Back to Operators
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/operators">
            <Button variant="ghost" size="sm" icon={faArrowLeft}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{operator.name}</h1>
            <p className="text-gray-600 mt-1">Operator Details & Configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: operator.name || '',
                    email: operator.email || '',
                    phone: operator.phone || '',
                    status: operator.status || 'ACTIVE',
                  });
                }}
                className="btn btn-secondary text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary text-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setEditMode(true)}
                variant="primary"
                size="sm"
                icon={faEdit}
              >
                Edit Operator
              </Button>
              <Button
                onClick={() => setDeleteModalOpen(true)}
                variant="secondary"
                size="sm"
                icon={faTrash}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Operator"
        message={
          <>
            Are you sure you want to delete <strong>{operator?.name}</strong> ({operator?.code})?
          </>
        }
        warningMessage={
          (operator?._count?.users > 0 || 
            operator?._count?.vehicles > 0 || 
            operator?._count?.drivers > 0 || 
            operator?._count?.orders > 0) ? (
            <>
              <p className="text-sm text-yellow-800">
                This operator has active resources:
              </p>
              <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                {operator?._count?.users > 0 && <li>{operator._count.users} users</li>}
                {operator?._count?.vehicles > 0 && <li>{operator._count.vehicles} vehicles</li>}
                {operator?._count?.drivers > 0 && <li>{operator._count.drivers} drivers</li>}
                {operator?._count?.orders > 0 && <li>{operator._count.orders} orders</li>}
              </ul>
              <p className="text-xs text-yellow-800 mt-2">
                Operators with active resources cannot be deleted. Please deactivate instead.
              </p>
            </>
          ) : undefined
        }
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        disabled={
          (operator?._count?.users > 0 || 
            operator?._count?.vehicles > 0 || 
            operator?._count?.drivers > 0 || 
            operator?._count?.orders > 0) || false
        }
      />

      {/* Operator Info */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={faBuilding} className="text-[#0b66c2]" />
          <h3 className="text-lg font-semibold text-gray-900">Operator Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
            <input
              type="text"
              value={operator.code}
              disabled
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Operator code cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            {editMode ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{operator.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            {editMode ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{operator.email || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            {editMode ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2">{operator.phone || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            {editMode ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            ) : (
              <span className={`status-badge ${operator.status === 'ACTIVE' ? 'status-resolved' : operator.status === 'INACTIVE' ? 'status-open' : 'status-closed'}`}>
                {operator.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Resource Counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={faUsers} className="text-[#0b66c2]" size="sm" />
            <h4 className="text-sm font-medium text-gray-700">Users</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{operator._count?.users || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={faTruck} className="text-[#0b66c2]" size="sm" />
            <h4 className="text-sm font-medium text-gray-700">Vehicles</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{operator._count?.vehicles || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={faUser} className="text-[#0b66c2]" size="sm" />
            <h4 className="text-sm font-medium text-gray-700">Drivers</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{operator._count?.drivers || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={faBox} className="text-[#0b66c2]" size="sm" />
            <h4 className="text-sm font-medium text-gray-700">Orders</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{operator._count?.orders || 0}</p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon={faCog} className="text-[#0b66c2]" />
            <h3 className="text-lg font-semibold text-gray-900">Operator Configuration</h3>
          </div>
          {!configEditMode && (
            <button
              onClick={() => setConfigEditMode(true)}
              className="btn btn-primary text-sm"
            >
              Edit Configuration
            </button>
          )}
        </div>

        {configEditMode && (
          <div className="mb-4 flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                setConfigEditMode(false);
                // Reset config data
                if (operator.operator_config) {
                  const config = operator.operator_config;
                  setConfigData({
                    supports_documents: config.supports_documents || false,
                    supports_small_parcel: config.supports_small_parcel || false,
                    supports_electronics: config.supports_electronics || false,
                    supports_fragile: config.supports_fragile || false,
                    supports_perishables: config.supports_perishables || false,
                    supports_bulky: config.supports_bulky || false,
                    max_weight_kg: config.max_weight_kg || '',
                    max_dimensions_cm: config.max_dimensions_cm || '',
                    supports_same_day: config.supports_same_day || false,
                    supports_next_day: config.supports_next_day || false,
                    supports_scheduled: config.supports_scheduled || false,
                    supports_express: config.supports_express || false,
                    supports_intercity: config.supports_intercity || false,
                    supports_prepaid: config.supports_prepaid !== undefined ? config.supports_prepaid : true,
                    supports_cod: config.supports_cod || false,
                    supports_corporate: config.supports_corporate || false,
                  });
                }
              }}
              className="btn btn-secondary text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleConfigSave}
              disabled={saving}
              className="btn btn-primary text-sm"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Item Handling */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Item Handling</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'supports_documents', label: 'Documents' },
                { key: 'supports_small_parcel', label: 'Small Parcel' },
                { key: 'supports_electronics', label: 'Electronics' },
                { key: 'supports_fragile', label: 'Fragile Items' },
                { key: 'supports_perishables', label: 'Perishables' },
                { key: 'supports_bulky', label: 'Bulky Items' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configData[item.key as keyof typeof configData] as boolean}
                    onChange={(e) => setConfigData({ ...configData, [item.key]: e.target.checked })}
                    disabled={!configEditMode}
                    className="rounded border-gray-300 text-[#0b66c2] focus:ring-[#0b66c2]"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                  {!configEditMode && (
                    configData[item.key as keyof typeof configData] ? (
                      <Icon icon={faCheckCircle} className="text-green-600" size="xs" />
                    ) : (
                      <Icon icon={faTimesCircle} className="text-gray-400" size="xs" />
                    )
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Weight (kg)</label>
                {configEditMode ? (
                  <input
                    type="number"
                    value={configData.max_weight_kg}
                    onChange={(e) => setConfigData({ ...configData, max_weight_kg: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                    placeholder="No limit"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{operator.operator_config?.max_weight_kg || 'No limit'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Dimensions (cm)</label>
                {configEditMode ? (
                  <input
                    type="text"
                    value={configData.max_dimensions_cm}
                    onChange={(e) => setConfigData({ ...configData, max_dimensions_cm: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
                    placeholder='{"length": 100, "width": 50, "height": 50}'
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{operator.operator_config?.max_dimensions_cm || 'No limit'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Modes */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Delivery Modes</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'supports_same_day', label: 'Same Day' },
                { key: 'supports_next_day', label: 'Next Day' },
                { key: 'supports_scheduled', label: 'Scheduled' },
                { key: 'supports_express', label: 'Express' },
                { key: 'supports_intercity', label: 'Intercity' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configData[item.key as keyof typeof configData] as boolean}
                    onChange={(e) => setConfigData({ ...configData, [item.key]: e.target.checked })}
                    disabled={!configEditMode}
                    className="rounded border-gray-300 text-[#0b66c2] focus:ring-[#0b66c2]"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                  {!configEditMode && (
                    configData[item.key as keyof typeof configData] ? (
                      <Icon icon={faCheckCircle} className="text-green-600" size="xs" />
                    ) : (
                      <Icon icon={faTimesCircle} className="text-gray-400" size="xs" />
                    )
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Payment Types */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'supports_prepaid', label: 'Prepaid' },
                { key: 'supports_cod', label: 'Cash on Delivery' },
                { key: 'supports_corporate', label: 'Corporate' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configData[item.key as keyof typeof configData] as boolean}
                    onChange={(e) => setConfigData({ ...configData, [item.key]: e.target.checked })}
                    disabled={!configEditMode}
                    className="rounded border-gray-300 text-[#0b66c2] focus:ring-[#0b66c2]"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                  {!configEditMode && (
                    configData[item.key as keyof typeof configData] ? (
                      <Icon icon={faCheckCircle} className="text-green-600" size="xs" />
                    ) : (
                      <Icon icon={faTimesCircle} className="text-gray-400" size="xs" />
                    )
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

