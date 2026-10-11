const interviews = [
  {
    time: "09.00",
    name: "Nadia Putri",
    position: "UI/UX Designer",
  },
  {
    time: "10.30",
    name: "Ahmad Fauzi",
    position: "Frontend Developer",
  },
  {
    time: "13.00",
    name: "Bagas Pratama",
    position: "Backend Developer",
  },
];

export default function InterviewToday() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <h2 className="mb-5 text-lg font-semibold">
        Jadwal Wawancara Hari Ini
      </h2>

      <div className="space-y-4">

        {interviews.map((item) => (

          <div
            key={item.name}
            className="rounded-xl border border-gray-200 p-4"
          >

            <p className="text-xs text-gray-500">
              {item.time}
            </p>

            <h3 className="mt-1 font-semibold">
              {item.name}
            </h3>

            <p className="text-sm text-gray-500">
              {item.position}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}