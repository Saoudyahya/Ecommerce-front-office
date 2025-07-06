import AdminPageClient from "./page.client";

export default function AdminPage() {
  // Mock data for UserWithUploads
  const mockData = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      uploads: [
        {
          id: "101",
          key: "image-1234abcd",
          url: "https://picsum.photos/seed/101/800/600",
          type: "image",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        },
        {
          id: "102",
          key: "image-5678efgh",
          url: "https://picsum.photos/seed/102/800/600",
          type: "image",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        }
      ]
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      uploads: [
        {
          id: "201",
          key: "video-9012ijkl",
          url: "https://example.com/video1.mp4",
          type: "video",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        }
      ]
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      uploads: []
    }
  ];
  
  return <AdminPageClient initialData={mockData} />;
}
