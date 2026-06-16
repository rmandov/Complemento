export function useGeoJson() {
  const getGeoJson = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error(`Error cargando ${url}:`, error);

      return null;
    }
  };
  return { getGeoJson };
}
