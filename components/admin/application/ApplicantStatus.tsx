interface Props {
  status: string;
}

export default function ApplicantStatus({
  status,
}: Props) {

  let style =
    "bg-gray-100 text-gray-700";

  if (status === "Pengajuan Baru") {
    style = "bg-blue-100 text-blue-700";
  }

  if (status === "Menunggu Pemeriksaan") {
    style = "bg-yellow-100 text-yellow-700";
  }

  if (status === "Revisi") {
    style = "bg-orange-100 text-orange-700";
  }

  if (status === "Ditolak") {
    style = "bg-red-100 text-red-700";
  }

  if (status === "Diterima") {
    style = "bg-green-100 text-green-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status}
    </span>
  );
}