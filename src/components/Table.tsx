import { useState, useEffect, useRef } from "react";
import type {
  DataTableSelectionMultipleChangeEvent,
  DataTablePageEvent
} from "primereact/datatable";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import axios from "axios";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import type { Artwork } from "../types/table";



const Table = () => {
  const [products, setProducts] = useState<Artwork[]>([]);
  const [pageNo, setPageNo] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectLimit, setSelectLimit] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const rowsPerPage = 12;
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const res = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${pageNo}`
      );
      const pageData: Artwork[] = res.data.data;

      setProducts(pageData);
      setTotalRecords(res.data.pagination.total);

      setLoading(false);
    };

    fetchData();
  }, [pageNo]);


  const onSelectionChange = (e: DataTableSelectionMultipleChangeEvent<Artwork[]>) => {
    const changed = e.value.map((item: Artwork) => item.id);

    setSelectedIds((prev) => {
      const updated = [...prev];

      products.forEach((item) => {
        if (changed.includes(item.id) && !updated.includes(item.id)) {
          updated.push(item.id);
        } else if (!changed.includes(item.id) && updated.includes(item.id)) {
          updated.splice(updated.indexOf(item.id), 1);
        }
      });

      return updated;
    });
  };


  const handlePageChange = (event: DataTablePageEvent) => {
    setPageNo((event.page ?? 0) + 1);
  };


  const handleBulkSelect = async () => {
    let limit = parseInt(selectLimit);

    if (!limit || limit <= 0) return;
    if (limit > totalRecords) limit = totalRecords;

    const neededPages = Math.ceil(limit / rowsPerPage);
    const ids: number[] = [];

    setLoading(true);

    for (let i = 1; i <= neededPages; i++) {
      const res = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${i}`
      );
      const pageData = res.data.data as Artwork[];

      ids.push(...pageData.map((item) => item.id));

      if (ids.length >= limit) break;
    }

    setSelectedIds(ids.slice(0, limit));
    setLoading(false);
    op.current?.hide();
  };


  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  return (
    <div >
      <DataTable
        value={products}
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        lazy
        loading={loading}
        onPage={handlePageChange}
        first={(pageNo - 1) * rowsPerPage}
        selectionMode="checkbox"
        selection={selectedProducts}
        onSelectionChange={onSelectionChange}
        dataKey="id"
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column
          header={
            <i
              className="pi pi-chevron-down cursor-pointer"
              onClick={(e) => op.current?.toggle(e)}
            ></i>
          }
          headerStyle={{ width: "2rem" }}
        />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>

      <OverlayPanel ref={op}>
        <div className="flex flex-col gap-3 p-2 ">
          <InputText
            keyfilter="int"
            placeholder="Select rows..."
            value={selectLimit}
            onChange={(e) => setSelectLimit(e.target.value)}
          />
          <div className="flex justify-end">
            <Button outlined severity="secondary" onClick={handleBulkSelect}>
              submit
            </Button>
          </div>
        </div>
      </OverlayPanel>
    </div>
  );
}


export default Table;