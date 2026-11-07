import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term") || "trending";

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        term
      )}&entity=song&limit=12`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache search queries for 1 hour
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch from iTunes API");
    }

    const data = await res.json();

    const formattedTracks = (data.results || []).map((item: any) => ({
      id: String(item.trackId),
      title: item.trackName,
      artist: item.artistName,
      coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "300x300bb") : "",
      audioUrl: item.previewUrl,
      previewUrl: item.previewUrl,
      duration: 30, // iTunes previews are 30-second snippets
    }));

    return NextResponse.json({ tracks: formattedTracks });
  } catch (error) {
    console.error("iTunes API error fallback:", error);
    const DEFAULT_AUDIO =
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/03/49/74/034974c8-356a-e751-24fe-5c5ffbe51fb8/mzaf_10332306713437145885.plus.aac.p.m4a";
    // Graceful fallback sample tracks if iTunes rate limits or network offline
    const fallbackTracks = [
      {
        id: "fb_1",
        title: "Lost in Kyoto",
        artist: "Tycho",
        coverUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&h=200&fit=crop",
        audioUrl: DEFAULT_AUDIO,
        previewUrl: DEFAULT_AUDIO,
        duration: 30,
      },
      {
        id: "fb_2",
        title: "Midnight City",
        artist: "M83",
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop",
        audioUrl: DEFAULT_AUDIO,
        previewUrl: DEFAULT_AUDIO,
        duration: 30,
      },
      {
        id: "fb_3",
        title: "Resonance",
        artist: "HOME",
        coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
        audioUrl: DEFAULT_AUDIO,
        previewUrl: DEFAULT_AUDIO,
        duration: 30,
      },
    ];
    return NextResponse.json({ tracks: fallbackTracks });
  }
}

