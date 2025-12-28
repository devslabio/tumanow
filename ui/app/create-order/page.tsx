'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/components/Toaster';
import { Button, Input, Textarea, Select, Card, CardBody, Container, PageHeader } from '@/app/components';
import Icon, { faMapMarkerAlt, faBox, faDollarSign, faPaperPlane } from '@/app/components/Icon';

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Implement order creation API call
    setTimeout(() => {
      toast.success('Order created successfully!');
      router.push('/dashboard');
      setLoading(false);
    }, 1000);
  };

  return (
    <Container maxWidth="lg" className="py-8">
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
                    />
                    <Input
                      label="Declared Value (RWF)"
                      type="number"
                      placeholder="0"
                      value={formData.declaredValue}
                      onChange={(e) => setFormData({ ...formData, declaredValue: e.target.value })}
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
                    <span className="font-medium">-</span>
                  </div>
                  {formData.isFragile && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fragile Handling</span>
                      <span className="font-medium">+ RWF 5,000</span>
                    </div>
                  )}
                  {formData.isInsured && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance</span>
                      <span className="font-medium">+ RWF 2,000</span>
                    </div>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">-</span>
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
  );
}

