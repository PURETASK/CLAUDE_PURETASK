'use client';

const ROOM_OPTIONS = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'living_room', label: 'Living Room' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'master_bedroom', label: 'Master Bedroom' },
  { value: 'other_bedrooms', label: 'Other Bedrooms' },
  { value: 'office', label: 'Office' },
  { value: 'garage', label: 'Garage' },
  { value: 'basement', label: 'Basement' },
  { value: 'other', label: 'Other' },
] as const;

type Props = {
  selectedRooms: string[];
  register: (name: 'skip_photo_rooms') => Record<string, unknown>;
  otherRoom: string;
  onOtherRoomChange: (value: string) => void;
};

export const RoomMultiSelect = ({
  selectedRooms,
  register,
  otherRoom,
  onOtherRoomChange,
}: Props) => {
  return (
    <fieldset className="flex flex-col gap-2 rounded border p-3">
      <legend className="text-sm font-medium">Rooms to skip</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ROOM_OPTIONS.map((room) => (
          <label key={room.value} className="text-sm">
            <input
              type="checkbox"
              value={room.value}
              {...register('skip_photo_rooms')}
              className="mr-2"
            />
            {room.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        {selectedRooms.length === 0
          ? 'No rooms selected.'
          : `${selectedRooms.length} room(s) selected`}
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span>If Other, specify room</span>
        <input
          type="text"
          value={otherRoom}
          onChange={(event) => onOtherRoomChange(event.target.value)}
          className="rounded border px-3 py-2 text-sm"
          placeholder="e.g. nursery"
        />
      </label>
    </fieldset>
  );
};
