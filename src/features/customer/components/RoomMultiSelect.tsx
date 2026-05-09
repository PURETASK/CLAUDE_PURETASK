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
    <fieldset className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <legend className="text-sm font-semibold text-neutral-700">Rooms to skip</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ROOM_OPTIONS.map((room) => (
          <label
            key={room.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700"
          >
            <input
              type="checkbox"
              value={room.value}
              {...register('skip_photo_rooms')}
              className="h-4 w-4 rounded border-neutral-300 accent-brand-600"
            />
            {room.label}
          </label>
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        {selectedRooms.length === 0
          ? 'No rooms selected.'
          : `${selectedRooms.length} room(s) selected`}
      </p>
      <div className="flex flex-col gap-1 text-sm">
        <label className="text-sm font-medium text-neutral-700">If Other, specify room</label>
        <input
          type="text"
          value={otherRoom}
          onChange={(event) => onOtherRoomChange(event.target.value)}
          className="pt-field"
          placeholder="e.g. nursery"
        />
      </div>
    </fieldset>
  );
};
