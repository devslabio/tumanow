'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/components/Toaster';
import { Button, Input, Textarea, Select, Card, CardBody, Container, PageHeader } from '@/app/components';
import Icon, { faMapMarkerAlt, faBox, faDollarSign, faPaperPlane } from '@/app/components/Icon';
import { OrdersAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function CreateOrderPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    // Pickup Details
    pickupAddress: '',
    pickupContactName: '',
    pickupContactPhone: '',
    
    // Delivery Details
    deliveryAddress: '',
    deliveryContactName: '',
    deliveryContactPhone: '',
    
    // Item Details
    itemType: '',
    itemDescription: '',
    weight: '',
    isFragile: false,
    isInsured: false,
    declaredValue: '',
    
    // Delivery Mode
    deliveryMode: 'SAME_DAY',
  });

  const itemTypes = [
    { value: 'DOCUMENTS', label: 'Documents' },
    { value: 'SMALL_PARCEL', label: 'Small Parcel' },
    { value: 'ELECTRONICS', label: 'Electronics' },
    { value: 'FRAGILE', label: 'Fragile Items' },
    { value: 'PERISHABLES', label: 'Perishables' },
    { value: 'BULKY', label: 'Bulky Items' },
  ];

  const deliveryModes = [
    { value: 'SAME_DAY', label: 'Same Day' },
    { value: 'NEXT_DAY', label: 'Next Day' },
    { value: 'EXPRESS', label: 'Express' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'INTERCITY', label: 'Intercity' },
  ];

  // Calculate pricing
  const calculatePricing = () => {
    const basePrice = 5000; // Base price in RWF
    const fragileHandling = formData.isFragile ? 5000 : 0;
    const insuranceFee = formData.isInsured ? 2000 : 0;
    const totalPrice = basePrice + fragileHandling + insuranceFee;
    return { basePrice, fragileHandling, insuranceFee, totalPrice };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }

    if (!formData.pickupContactPhone.trim()) {
      newErrors.pickupContactPhone = 'Pickup contact phone is required';
    } else if (!/^\+?250\d{9}$/.test(formData.pickupContactPhone.replace(/\s/g, ''))) {
      newErrors.pickupContactPhone = 'Invalid phone number format (e.g., +250788123456)';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }

    if (!formData.deliveryContactPhone.trim()) {
      newErrors.deliveryContactPhone = 'Delivery contact phone is required';
    } else if (!/^\+?250\d{9}$/.test(formData.deliveryContactPhone.replace(/\s/g, ''))) {
      newErrors.deliveryContactPhone = 'Invalid phone number format (e.g., +250788123456)';
    }

    if (!formData.itemType) {
      newErrors.itemType = 'Item type is required';
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 0)) {
      newErrors.weight = 'Weight must be a positive number';
    }

    if (formData.declaredValue && (isNaN(Number(formData.declaredValue)) || Number(formData.declaredValue) < 0)) {
      newErrors.declaredValue = 'Declared value must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!user) {
      toast.error('Please log in to create an order');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { basePrice, fragileHandling, insuranceFee, totalPrice } = calculatePricing();

      const orderData = {
        operator_id: user.operator_id || '', // Will be set by backend if user has operator_id
        customer_id: user.id,
        pickup_address: formData.pickupAddress.trim(),
        pickup_contact_name: formData.pickupContactName.trim() || undefined,
        pickup_contact_phone: formData.pickupContactPhone.trim(),
        delivery_address: formData.deliveryAddress.trim(),
        delivery_contact_name: formData.deliveryContactName.trim() || undefined,
        delivery_contact_phone: formData.deliveryContactPhone.trim(),
        item_type: formData.itemType,
        item_description: formData.itemDescription.trim() || undefined,
        weight_kg: formData.weight ? Number(formData.weight) : undefined,
        declared_value: formData.declaredValue ? Number(formData.declaredValue) : undefined,
        is_fragile: formData.isFragile,
        is_insured: formData.isInsured,
        delivery_mode: formData.deliveryMode,
        base_price: basePrice,
        surcharges: fragileHandling,
        insurance_fee: insuranceFee,
        total_price: totalPrice,
      };

      const newOrder = await OrdersAPI.create(orderData);
      toast.success('Order created successfully!');
      router.push(`/dashboard/orders/${newOrder.id}`);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create order. Please try again.';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="xl" className="py-8">
      <PageHeader
        title="Create New Order"
        subtitle="Fill in the details to create a delivery order"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pickup Details */}
            <Card>
              <CardBody>
                <h3 className="h3 mb-4 flex items-center gap-2">
                  <Icon icon={faMapMarkerAlt} className="text-primary" />
                  Pickup Details
                </h3>
                <div className="space-y-4">
                  <Textarea
                    label="Pickup Address"
                    placeholder="Enter complete pickup address"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    required
                    error={errors.pickupAddress}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Contact Name"
                      placeholder="Pickup contact name"
                      value={formData.pickupContactName}
                      onChange={(e) => setFormData({ ...formData, pickupContactName: e.target.value })}
                      required
                    />
                    <Input
                      label="Contact Phone"
                      type="tel"
                      placeholder="+250788123456"
                      value={formData.pickupContactPhone}
                      onChange={(e) => setFormData({ ...formData, pickupContactPhone: e.target.value })}
                      required
                      error={errors.pickupContactPhone}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Delivery Details */}
            <Card>
              <CardBody>
                <h3 className="h3 mb-4 flex items-center gap-2">
                  <Icon icon={faMapMarkerAlt} className="text-primary" />
                  Delivery Details
                </h3>
                <div className="space-y-4">
                  <Textarea
                    label="Delivery Address"
                    placeholder="Enter complete delivery address"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    required
                    error={errors.deliveryAddress}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Contact Name"
                      placeholder="Delivery contact name"
                      value={formData.deliveryContactName}
                      onChange={(e) => setFormData({ ...formData, deliveryContactName: e.target.value })}
                      required
                    />
                    <Input
                      label="Contact Phone"
                      type="tel"
                      placeholder="+250788123456"
                      value={formData.deliveryContactPhone}
                      onChange={(e) => setFormData({ ...formData, deliveryContactPhone: e.target.value })}
                      required
                      error={errors.deliveryContactPhone}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Item Details */}
            <Card>
              <CardBody>
                <h3 className="h3 mb-4 flex items-center gap-2">
                  <Icon icon={faBox} className="text-primary" />
                  Item Details
                </h3>
                <div className="space-y-4">
                  <Select
                    label="Item Type"
                    options={itemTypes}
                    value={formData.itemType}
                    onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                    placeholder="Select item type"
                    required
                    error={errors.itemType}
                  />
                  <Textarea
                    label="Description"
                    placeholder="Describe the item"
                    value={formData.itemDescription}
                    onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Weight (kg)"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      error={errors.weight}
                    />
                    <Input
                      label="Declared Value (RWF)"
                      type="number"
                      placeholder="0"
                      value={formData.declaredValue}
                      onChange={(e) => setFormData({ ...formData, declaredValue: e.target.value })}
                      error={errors.declaredValue}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFragile}
                        onChange={(e) => setFormData({ ...formData, isFragile: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Fragile item (extra handling required)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isInsured}
                        onChange={(e) => setFormData({ ...formData, isInsured: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Insure this package</span>
                    </label>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Delivery Mode */}
            <Card>
              <CardBody>
                <h3 className="h3 mb-4 flex items-center gap-2">
                  <Icon icon={faDollarSign} className="text-primary" />
                  Delivery Options
                </h3>
                <Select
                  label="Delivery Mode"
                  options={deliveryModes}
                  value={formData.deliveryMode}
                  onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value })}
                  required
                />
              </CardBody>
            </Card>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={faPaperPlane}
              loading={loading}
              className="w-full"
            >
              Create Order
            </Button>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardBody>
                <h3 className="h3 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-medium">RWF {calculatePricing().basePrice.toLocaleString()}</span>
                  </div>
                  {formData.isFragile && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fragile Handling</span>
                      <span className="font-medium">+ RWF {calculatePricing().fragileHandling.toLocaleString()}</span>
                    </div>
                  )}
                  {formData.isInsured && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance</span>
                      <span className="font-medium">+ RWF {calculatePricing().insuranceFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-[#0b66c2]">RWF {calculatePricing().totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Final price will be calculated after address verification
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
      </Container>
    </div>
  );
}

