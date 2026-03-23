"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/mandate");
      const json = await res.json();
      setData(json || []);
    };

    fetchData();
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">
        Saved Mandates
      </h1>

      <div className="space-y-4">
        {data.map((item, i) => (
          <div
            key={i}
            className="border p-4 rounded-lg bg-white"
          >
            <p><strong>EMV:</strong> €{item.property.emv}</p>
            <p><strong>Seller:</strong> €{item.property.sellerAskingPrice}</p>
            <p><strong>Deviation:</strong> {item.property.deviation}%</p>

            <p className="mt-2">
              <strong>Recommended:</strong>{" "}
              {item.decision.recommendedPath}
            </p>

            <p className="text-sm text-gray-500 mt-2">
              {item.broker.summary}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}