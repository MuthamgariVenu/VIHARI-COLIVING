'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { roomAPI, bedAPI } from '@/lib/api';
import { Plus, DoorOpen, Bed as BedIcon } from 'lucide-react';

export default function ManagerRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isBedDialogOpen, setIsBedDialogOpen] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    branchId: '',
    roomNumber: '',
    floor: '',
    totalBeds: '',
    type: 'SHARED',
  });
  const [bedFormData, setBedFormData] = useState({
    roomId: '',
    branchId: '',
    bedNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const branchId = user.branchId;
      
      const [roomsData, bedsData] = await Promise.all([
        roomAPI.getAll(),
        bedAPI.getAll(),
      ]);
      
      setRooms(roomsData);
      setBeds(bedsData);
      setRoomFormData(prev => ({ ...prev, branchId }));
      setBedFormData(prev => ({ ...prev, branchId }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await roomAPI.create({
        ...roomFormData,
        floor: parseInt(roomFormData.floor) || 0,
        totalBeds: parseInt(roomFormData.totalBeds),
      });
      setIsRoomDialogOpen(false);
      setRoomFormData(prev => ({
        branchId: prev.branchId,
        roomNumber: '',
        floor: '',
        totalBeds: '',
        type: 'SHARED',
      }));
      loadData();
      alert(`Room created successfully! ${result.bedsCreated || roomFormData.totalBeds} beds auto-generated.`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBedSubmit = async (e) => {
    e.preventDefault();
    try {
      await bedAPI.create(bedFormData);
      setIsBedDialogOpen(false);
      setBedFormData(prev => ({
        roomId: '',
        branchId: prev.branchId,
        bedNumber: '',
      }));
      loadData();
      alert('Bed created successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <DashboardLayout role="MANAGER">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Rooms & Beds</h2>
          <p className="text-slate-600 mt-1">Manage rooms and bed allocations</p>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="beds">Beds</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <Plus className="mr-2 h-4 w-4" /> Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRoomSubmit} className="space-y-4">
                    <div>
                      <Label>Room Number *</Label>
                      <Input
                        value={roomFormData.roomNumber}
                        onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Floor</Label>
                      <Input
                        type="number"
                        value={roomFormData.floor}
                        onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Total Beds *</Label>
                      <Input
                        type="number"
                        value={roomFormData.totalBeds}
                        onChange={(e) => setRoomFormData({ ...roomFormData, totalBeds: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Type *</Label>
                      <Select
                        value={roomFormData.type}
                        onValueChange={(value) => setRoomFormData({ ...roomFormData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SHARED">Shared</SelectItem>
                          <SelectItem value="PRIVATE">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">Create Room</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.roomId}>
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <DoorOpen className="h-6 w-6" />
                      <CardTitle>Room {room.roomNumber}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Floor:</span> {room.floor || 'Ground'}</p>
                      <p><span className="font-medium">Total Beds:</span> {room.totalBeds}</p>
                      <p><span className="font-medium">Type:</span> {room.type}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="beds" className="space-y-4">
            <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg mb-4">
              <p>Beds are automatically created when rooms are added. Each room generates beds based on the Total Beds count.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {beds.map((bed) => {
                const room = rooms.find(r => r.roomId === bed.roomId);
                return (
                  <Card key={bed.bedId} className={bed.isOccupied ? 'border-red-200' : 'border-green-200'}>
                    <CardContent className="pt-6 text-center">
                      <BedIcon className={`h-12 w-12 mx-auto mb-3 ${
                        bed.isOccupied ? 'text-red-500' : 'text-green-500'
                      }`} />
                      <h4 className="font-semibold text-lg">Bed {bed.bedNumber}</h4>
                      <p className="text-sm text-slate-600">Room {room?.roomNumber}</p>
                      <div className="mt-3">
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          bed.isOccupied
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {bed.isOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {beds.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No beds found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}