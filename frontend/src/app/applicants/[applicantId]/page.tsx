export default function DetailedApplicantInfo() {
  return (
    <div className="w-full flex flex-col items-center gap-4 p-4">
      <h1>Detailed Appplicant Info</h1>

      {/* Document Viewer Container */}
      <section>
        <h3>View Documents</h3>
        <div>
          <button>CV</button>
          <button>Transcript</button>
        </div>
        <div>
          <p>Document</p>
        </div>
      </section>

      {/*Candidate INFO Container*/}
      <div>
        {/* Canidate Summary Section */}
        <section>
          <div>
            <h4>AI Summary</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Rerum
              fugit enim tempore, quibusdam ad facere officiis quas, sint
              explicabo eum voluptatem placeat esse in dolor tempora et velit
              vero consectetur!
            </p>
          </div>

          <div>
            <h4>Key Strengths</h4>
            <ul>
              <li>Skill 1</li>
              <li>Skill 2</li>
              <li>Skill 3</li>
              <li>Skill 4</li>
            </ul>
          </div>
        </section>

        {/* Candidate Rating section*/}
        <section>
          <div>
            <h4>Candidate Review</h4>
            <label htmlFor="potential-select">Potential Candidate:</label>
            <select id="potential-select" name="potential">
              <option value="null">Is this a potential candidate?</option>
              <option value="Yes">Yes</option>
              <option value="Maybe">Maybe</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label htmlFor="strength-select">Candidate Strength:</label>
            <select id="strength-select" name="strength">
              <option value="null">Weigh strength of candidate</option>
              <option value="Strong">Strong</option>
              <option value="Medium">Medium</option>
              <option value="Weak">Weak</option>
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}
