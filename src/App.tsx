import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

interface Website {
  id: number;
  url: string;
  status: number;
}

function setupSupabase() {
  const env = process.env
  const supabaseUrl =  env.REACT_APP_SUPABASE_URL || "";
  const supabaseKey =  env.REACT_APP_SUPABASE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  return supabase;
}

const supabase = setupSupabase();

function App() {
  const [websites, setWebsites] = useState<{ [key: string]: Website }>();

  useEffect(function () {
    (async () => {
      const { data, error } = await supabase.from("websites").select("*");
      if (error == null) {
        setWebsites(
          data?.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
          }, {})
        );
      }
    })();

    supabase
      .channel("table-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "websites" },
        handleChanges
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "websites",
        },
        handleChanges
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "websites",
        },
        handleDelete
      )
      .subscribe();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChanges = (payload: any) => {
    setWebsites((prevState) => {
      const temp = Object.assign({}, prevState, {
        [payload.new.id]: payload.new,
      });

      return temp;
    });
  };

  const handleDelete = (payload: any) => {
    setWebsites((prevState) => {
      if (payload.old == null) {
        return;
      }

      const id = payload.old.id;
      const updatedWebsites = Object.assign({}, prevState);
      delete updatedWebsites[id];
      return updatedWebsites;
    });
  };

  console.log("hmm", websites);
  if (websites !== null && websites !== undefined) {
    console.log("websites", websites);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} />
        <h1>Monitoring</h1>

        <div style={{"margin" : "30px"}}>
        <table>
          <tr>
            <th><b>Link</b></th>
            <th><b>Status</b></th>
          </tr>
          {websites &&
            Object.entries(websites).map(([id, website]) => (
              <tr>
                <td><a href={website.url}>{website.url}</a></td>
                <td
                  style={
                    website.status.toString().startsWith("20")
                      ? { color: "green" }
                      : { color: "red" }
                  }
                >
                  {website.status}
                </td>
              </tr>
            ))}
        </table>
        </div>
      </header>
    </div>
  );
}

export default App;
